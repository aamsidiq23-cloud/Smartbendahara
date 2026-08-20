-- ============================================
-- Smart Bendahara — Notification Triggers
-- Migration 005: Auto-trigger WA notifications
-- Uses pg_net extension to call Edge Function
-- ============================================
-- NOTE: pg_net must be enabled in your Supabase project.
-- Go to Database > Extensions > enable "pg_net" (HTTP client)
-- ============================================

-- Enable pg_net extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- Helper function to call the WA Edge Function
-- Reusable by all triggers
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_wa_notification(
  p_event_type TEXT,
  p_student_id UUID,
  p_tenant_id UUID,
  p_template_vars JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_function_url TEXT;
BEGIN
  -- Get Supabase URL from config (set via Supabase dashboard or vault)
  -- These are available as database settings in Supabase
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  -- Fallback: skip silently if not configured
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    -- Still log the attempt
    INSERT INTO notification_logs (tenant_id, student_id, event_type, status, message_sent)
    VALUES (p_tenant_id, p_student_id, p_event_type, 'skipped_no_gateway', 'Supabase URL/key belum dikonfigurasi untuk triggers');
    RETURN;
  END IF;

  v_function_url := v_supabase_url || '/functions/v1/send-wa-notification';

  -- Use pg_net to make async HTTP call (non-blocking)
  PERFORM net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'event_type', p_event_type,
      'student_id', p_student_id,
      'tenant_id', p_tenant_id,
      'template_vars', p_template_vars
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER 1: After SPP Payment becomes 'paid'
-- Sends confirmation WA to parent
-- ============================================
CREATE OR REPLACE FUNCTION public.trg_after_spp_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_months TEXT[] := ARRAY['Januari','Februari','Maret','April','Mei','Juni',
                           'Juli','Agustus','September','Oktober','November','Desember'];
BEGIN
  -- Only trigger when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM trigger_wa_notification(
      'spp_paid',
      NEW.student_id,
      NEW.tenant_id,
      jsonb_build_object(
        'month_year', v_months[NEW.month] || ' ' || NEW.year,
        'amount', NEW.amount_paid
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_spp_paid_notification
  AFTER UPDATE ON spp_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_after_spp_paid();

-- ============================================
-- TRIGGER 2: After Savings Deposit
-- ============================================
CREATE OR REPLACE FUNCTION public.trg_after_savings_tx()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'deposit' THEN
    PERFORM trigger_wa_notification(
      'savings_deposit',
      (SELECT student_id FROM savings_accounts WHERE id = NEW.savings_account_id),
      NEW.tenant_id,
      jsonb_build_object(
        'amount', NEW.amount,
        'balance', NEW.balance_after
      )
    );
  ELSIF NEW.type = 'withdrawal' THEN
    PERFORM trigger_wa_notification(
      'savings_withdrawal',
      (SELECT student_id FROM savings_accounts WHERE id = NEW.savings_account_id),
      NEW.tenant_id,
      jsonb_build_object(
        'amount', NEW.amount,
        'balance', NEW.balance_after
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_savings_notification
  AFTER INSERT ON savings_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_after_savings_tx();

-- ============================================
-- TRIGGER 3: After Bill Assignment Created (new bill)
-- ============================================
CREATE OR REPLACE FUNCTION public.trg_after_bill_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_bill custom_bills%ROWTYPE;
BEGIN
  SELECT * INTO v_bill FROM custom_bills WHERE id = NEW.custom_bill_id;

  PERFORM trigger_wa_notification(
    'bill_created',
    NEW.student_id,
    NEW.tenant_id,
    jsonb_build_object(
      'bill_name', v_bill.name,
      'amount', NEW.amount_due,
      'due_date', COALESCE(v_bill.due_date::text, '-')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_bill_assigned_notification
  AFTER INSERT ON bill_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_after_bill_assigned();

-- ============================================
-- TRIGGER 4: After Bill Payment
-- ============================================
CREATE OR REPLACE FUNCTION public.trg_after_bill_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_assignment bill_assignments%ROWTYPE;
  v_bill custom_bills%ROWTYPE;
BEGIN
  SELECT * INTO v_assignment FROM bill_assignments WHERE id = NEW.bill_assignment_id;
  SELECT * INTO v_bill FROM custom_bills WHERE id = v_assignment.custom_bill_id;

  PERFORM trigger_wa_notification(
    'bill_paid',
    v_assignment.student_id,
    NEW.tenant_id,
    jsonb_build_object(
      'bill_name', v_bill.name,
      'amount', NEW.amount,
      'remaining', v_assignment.amount_due - v_assignment.amount_paid
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_bill_paid_notification
  AFTER INSERT ON bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_after_bill_paid();
