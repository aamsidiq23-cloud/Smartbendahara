-- ============================================
-- Smart Bendahara — Business Logic Functions
-- Migration 004: Server-side business functions
-- All financial mutations run atomically on the server
-- ============================================

-- ============================================
-- 1. RECORD SPP PAYMENT
-- Bayar/cicil SPP per siswa per bulan
-- Atomik: update payment + log aktivitas
-- ============================================
CREATE OR REPLACE FUNCTION public.record_spp_payment(
  p_payment_id UUID,
  p_amount INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_payment spp_payments%ROWTYPE;
  v_new_paid INTEGER;
  v_new_status VARCHAR(10);
BEGIN
  -- Get current user context
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Jumlah pembayaran harus lebih dari 0';
  END IF;

  -- Get existing payment record
  SELECT * INTO v_payment FROM spp_payments
  WHERE id = p_payment_id AND tenant_id = v_tenant_id;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Data pembayaran SPP tidak ditemukan';
  END IF;

  -- Calculate new amount paid
  v_new_paid := v_payment.amount_paid + p_amount;

  -- Prevent overpayment
  IF v_new_paid > v_payment.amount_due THEN
    RAISE EXCEPTION 'Jumlah pembayaran melebihi tagihan. Sisa: Rp %', (v_payment.amount_due - v_payment.amount_paid);
  END IF;

  -- Determine new status
  IF v_new_paid >= v_payment.amount_due THEN
    v_new_status := 'paid';
  ELSIF v_new_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  -- Update payment
  UPDATE spp_payments SET
    amount_paid = v_new_paid,
    status = v_new_status,
    paid_at = CASE WHEN v_new_status != 'unpaid' THEN NOW() ELSE paid_at END,
    recorded_by = v_user_id
  WHERE id = p_payment_id;

  -- Log activity
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (
    v_tenant_id, v_user_id, 'update', 'spp_payments', p_payment_id,
    json_build_object('amount_paid', v_payment.amount_paid, 'status', v_payment.status),
    json_build_object('amount_paid', v_new_paid, 'status', v_new_status, 'payment_amount', p_amount)
  );

  RETURN json_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'amount_paid', v_new_paid,
    'amount_due', v_payment.amount_due,
    'remaining', v_payment.amount_due - v_new_paid,
    'status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. GENERATE SPP FOR CLASS
-- Auto-generate baris SPP untuk seluruh siswa di kelas
-- untuk bulan & tahun tertentu
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_spp_for_class(
  p_class_id UUID,
  p_academic_year_id UUID,
  p_month SMALLINT,
  p_year SMALLINT
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_class classes%ROWTYPE;
  v_enrollment RECORD;
  v_count INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  -- Get current user context
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Validate month/year
  IF p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'Bulan harus antara 1-12';
  END IF;
  IF p_year < 2020 OR p_year > 2100 THEN
    RAISE EXCEPTION 'Tahun tidak valid';
  END IF;

  -- Get class info (for spp_amount)
  SELECT * INTO v_class FROM classes
  WHERE id = p_class_id AND tenant_id = v_tenant_id;

  IF v_class.id IS NULL THEN
    RAISE EXCEPTION 'Kelas tidak ditemukan';
  END IF;

  -- Loop through enrolled students
  FOR v_enrollment IN
    SELECT se.student_id
    FROM student_enrollments se
    WHERE se.class_id = p_class_id
      AND se.tenant_id = v_tenant_id
      AND se.is_active = TRUE
  LOOP
    -- Skip if already exists
    IF EXISTS (
      SELECT 1 FROM spp_payments
      WHERE tenant_id = v_tenant_id
        AND student_id = v_enrollment.student_id
        AND academic_year_id = p_academic_year_id
        AND month = p_month
        AND year = p_year
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Insert SPP payment record
    INSERT INTO spp_payments (
      tenant_id, student_id, academic_year_id,
      month, year, amount_due, amount_paid, status
    ) VALUES (
      v_tenant_id, v_enrollment.student_id, p_academic_year_id,
      p_month, p_year, v_class.spp_amount, 0, 'unpaid'
    );

    v_count := v_count + 1;
  END LOOP;

  -- Log activity
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (
    v_tenant_id, v_user_id, 'create', 'spp_payments', p_class_id,
    json_build_object('class', v_class.name, 'month', p_month, 'year', p_year, 'generated', v_count, 'skipped', v_skipped)
  );

  RETURN json_build_object(
    'success', true,
    'generated', v_count,
    'skipped', v_skipped,
    'class_name', v_class.name,
    'spp_amount', v_class.spp_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. PROCESS SAVINGS DEPOSIT
-- Setor tabungan — atomik: update saldo + insert transaksi
-- ============================================
CREATE OR REPLACE FUNCTION public.process_savings_deposit(
  p_account_id UUID,
  p_amount INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_account savings_accounts%ROWTYPE;
  v_new_balance INTEGER;
  v_tx_id UUID;
BEGIN
  -- Get current user context
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Jumlah setoran harus lebih dari 0';
  END IF;

  -- Get account with row lock to prevent race condition
  SELECT * INTO v_account FROM savings_accounts
  WHERE id = p_account_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Rekening tabungan tidak ditemukan';
  END IF;

  -- Calculate new balance
  v_new_balance := v_account.balance + p_amount;

  -- Update balance
  UPDATE savings_accounts SET balance = v_new_balance
  WHERE id = p_account_id;

  -- Insert transaction record
  INSERT INTO savings_transactions (
    tenant_id, savings_account_id, type, amount, balance_after, notes, recorded_by
  ) VALUES (
    v_tenant_id, p_account_id, 'deposit', p_amount, v_new_balance, p_notes, v_user_id
  ) RETURNING id INTO v_tx_id;

  -- Log activity
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (
    v_tenant_id, v_user_id, 'create', 'savings_transactions', v_tx_id,
    json_build_object('balance_before', v_account.balance),
    json_build_object('type', 'deposit', 'amount', p_amount, 'balance_after', v_new_balance)
  );

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'type', 'deposit',
    'amount', p_amount,
    'balance_before', v_account.balance,
    'balance_after', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. PROCESS SAVINGS WITHDRAWAL
-- Tarik tabungan — validasi saldo cukup, atomik
-- ============================================
CREATE OR REPLACE FUNCTION public.process_savings_withdrawal(
  p_account_id UUID,
  p_amount INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_account savings_accounts%ROWTYPE;
  v_new_balance INTEGER;
  v_tx_id UUID;
BEGIN
  -- Get current user context
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Jumlah penarikan harus lebih dari 0';
  END IF;

  -- Get account with row lock
  SELECT * INTO v_account FROM savings_accounts
  WHERE id = p_account_id AND tenant_id = v_tenant_id
  FOR UPDATE;

  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Rekening tabungan tidak ditemukan';
  END IF;

  -- Validate sufficient balance
  IF v_account.balance < p_amount THEN
    RAISE EXCEPTION 'Saldo tidak cukup. Saldo saat ini: Rp %', v_account.balance;
  END IF;

  -- Calculate new balance
  v_new_balance := v_account.balance - p_amount;

  -- Update balance
  UPDATE savings_accounts SET balance = v_new_balance
  WHERE id = p_account_id;

  -- Insert transaction record
  INSERT INTO savings_transactions (
    tenant_id, savings_account_id, type, amount, balance_after, notes, recorded_by
  ) VALUES (
    v_tenant_id, p_account_id, 'withdrawal', p_amount, v_new_balance, p_notes, v_user_id
  ) RETURNING id INTO v_tx_id;

  -- Log activity
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (
    v_tenant_id, v_user_id, 'create', 'savings_transactions', v_tx_id,
    json_build_object('balance_before', v_account.balance),
    json_build_object('type', 'withdrawal', 'amount', p_amount, 'balance_after', v_new_balance)
  );

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'type', 'withdrawal',
    'amount', p_amount,
    'balance_before', v_account.balance,
    'balance_after', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. RECORD BILL PAYMENT
-- Bayar tagihan insidental — update assignment + insert payment log
-- ============================================
CREATE OR REPLACE FUNCTION public.record_bill_payment(
  p_assignment_id UUID,
  p_amount INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_assignment bill_assignments%ROWTYPE;
  v_new_paid INTEGER;
  v_new_status VARCHAR(10);
  v_payment_id UUID;
BEGIN
  -- Get current user context
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Jumlah pembayaran harus lebih dari 0';
  END IF;

  -- Get assignment
  SELECT * INTO v_assignment FROM bill_assignments
  WHERE id = p_assignment_id AND tenant_id = v_tenant_id;

  IF v_assignment.id IS NULL THEN
    RAISE EXCEPTION 'Data tagihan tidak ditemukan';
  END IF;

  -- Calculate new amount paid
  v_new_paid := v_assignment.amount_paid + p_amount;

  -- Prevent overpayment
  IF v_new_paid > v_assignment.amount_due THEN
    RAISE EXCEPTION 'Jumlah pembayaran melebihi tagihan. Sisa: Rp %', (v_assignment.amount_due - v_assignment.amount_paid);
  END IF;

  -- Determine status
  IF v_new_paid >= v_assignment.amount_due THEN
    v_new_status := 'paid';
  ELSIF v_new_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  -- Update assignment
  UPDATE bill_assignments SET
    amount_paid = v_new_paid,
    status = v_new_status
  WHERE id = p_assignment_id;

  -- Insert payment record
  INSERT INTO bill_payments (
    tenant_id, bill_assignment_id, amount, recorded_by
  ) VALUES (
    v_tenant_id, p_assignment_id, p_amount, v_user_id
  ) RETURNING id INTO v_payment_id;

  -- Log activity
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (
    v_tenant_id, v_user_id, 'create', 'bill_payments', v_payment_id,
    json_build_object('amount_paid', v_assignment.amount_paid, 'status', v_assignment.status),
    json_build_object('amount_paid', v_new_paid, 'status', v_new_status, 'payment_amount', p_amount)
  );

  RETURN json_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'amount_paid', v_new_paid,
    'amount_due', v_assignment.amount_due,
    'remaining', v_assignment.amount_due - v_new_paid,
    'status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. CREATE BILL WITH ASSIGNMENTS
-- Buat tagihan baru + auto-assign ke siswa per kelas
-- ============================================
CREATE OR REPLACE FUNCTION public.create_bill_with_assignments(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_default_amount INTEGER DEFAULT 0,
  p_due_date DATE DEFAULT NULL,
  p_class_ids UUID[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_bill_id UUID;
  v_enrollment RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Get current user context
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Validate input
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'Nama tagihan tidak boleh kosong';
  END IF;
  IF p_default_amount < 0 THEN
    RAISE EXCEPTION 'Nominal tagihan tidak boleh negatif';
  END IF;

  -- Create bill
  INSERT INTO custom_bills (
    tenant_id, name, description, default_amount, due_date, status, created_by
  ) VALUES (
    v_tenant_id, p_name, p_description, p_default_amount, p_due_date, 'active', v_user_id
  ) RETURNING id INTO v_bill_id;

  -- Assign to students in selected classes
  IF array_length(p_class_ids, 1) > 0 THEN
    FOR v_enrollment IN
      SELECT DISTINCT se.student_id
      FROM student_enrollments se
      WHERE se.class_id = ANY(p_class_ids)
        AND se.tenant_id = v_tenant_id
        AND se.is_active = TRUE
    LOOP
      INSERT INTO bill_assignments (
        tenant_id, custom_bill_id, student_id,
        amount_due, amount_paid, status
      ) VALUES (
        v_tenant_id, v_bill_id, v_enrollment.student_id,
        p_default_amount, 0, 'unpaid'
      );
      v_count := v_count + 1;
    END LOOP;
  END IF;

  -- Log activity
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (
    v_tenant_id, v_user_id, 'create', 'custom_bills', v_bill_id,
    json_build_object('name', p_name, 'amount', p_default_amount, 'assigned_students', v_count)
  );

  RETURN json_build_object(
    'success', true,
    'bill_id', v_bill_id,
    'name', p_name,
    'default_amount', p_default_amount,
    'assigned_students', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. GET DASHBOARD STATS
-- Aggregasi data dashboard dalam 1 query
-- Lebih efisien daripada 5+ query terpisah dari client
-- ============================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_total_students INTEGER;
  v_total_classes INTEGER;
  v_monthly_income INTEGER;
  v_total_arrears INTEGER;
  v_arrears_count INTEGER;
  v_total_savings INTEGER;
  v_current_month INTEGER;
  v_current_year INTEGER;
  v_monthly_income_data JSON;
  v_payment_status_data JSON;
  v_recent_activities JSON;
BEGIN
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_current_month := EXTRACT(MONTH FROM NOW());
  v_current_year := EXTRACT(YEAR FROM NOW());

  -- Total active students
  SELECT COUNT(*) INTO v_total_students
  FROM students WHERE tenant_id = v_tenant_id AND status = 'active';

  -- Total classes
  SELECT COUNT(*) INTO v_total_classes
  FROM classes WHERE tenant_id = v_tenant_id;

  -- Monthly income (paid SPP this month)
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_monthly_income
  FROM spp_payments
  WHERE tenant_id = v_tenant_id
    AND month = v_current_month
    AND year = v_current_year
    AND status = 'paid';

  -- Arrears (unpaid + partial)
  SELECT
    COALESCE(SUM(amount_due - amount_paid), 0),
    COUNT(*)
  INTO v_total_arrears, v_arrears_count
  FROM spp_payments
  WHERE tenant_id = v_tenant_id
    AND status IN ('unpaid', 'partial');

  -- Total savings
  SELECT COALESCE(SUM(balance), 0) INTO v_total_savings
  FROM savings_accounts WHERE tenant_id = v_tenant_id;

  -- Monthly income data (last 6 months)
  SELECT json_agg(row_data ORDER BY row_data->>'sort_key') INTO v_monthly_income_data
  FROM (
    SELECT json_build_object(
      'sort_key', TO_CHAR(d.month_start, 'YYYY-MM'),
      'month', TO_CHAR(d.month_start, 'Mon'),
      'amount', COALESCE(SUM(sp.amount_paid), 0)
    ) AS row_data
    FROM (
      SELECT generate_series(
        DATE_TRUNC('month', NOW()) - INTERVAL '5 months',
        DATE_TRUNC('month', NOW()),
        '1 month'
      )::date AS month_start
    ) d
    LEFT JOIN spp_payments sp ON
      sp.tenant_id = v_tenant_id
      AND sp.year = EXTRACT(YEAR FROM d.month_start)
      AND sp.month = EXTRACT(MONTH FROM d.month_start)
    GROUP BY d.month_start
  ) sub;

  -- Payment status distribution
  SELECT json_build_object(
    'paid', COUNT(*) FILTER (WHERE status = 'paid'),
    'partial', COUNT(*) FILTER (WHERE status = 'partial'),
    'unpaid', COUNT(*) FILTER (WHERE status = 'unpaid')
  ) INTO v_payment_status_data
  FROM spp_payments WHERE tenant_id = v_tenant_id;

  -- Recent activities (last 10)
  SELECT COALESCE(json_agg(row_data), '[]'::json) INTO v_recent_activities
  FROM (
    SELECT json_build_object(
      'id', al.id,
      'action', al.action,
      'entity_type', al.entity_type,
      'entity_id', al.entity_id,
      'after_data', al.after_data,
      'created_at', al.created_at,
      'user_name', u.name
    ) AS row_data
    FROM activity_logs al
    LEFT JOIN users u ON u.id = al.user_id
    WHERE al.tenant_id = v_tenant_id
    ORDER BY al.created_at DESC
    LIMIT 10
  ) sub;

  RETURN json_build_object(
    'success', true,
    'total_students', v_total_students,
    'total_classes', v_total_classes,
    'monthly_income', v_monthly_income,
    'total_arrears', v_total_arrears,
    'arrears_count', v_arrears_count,
    'total_savings', v_total_savings,
    'monthly_income_data', COALESCE(v_monthly_income_data, '[]'::json),
    'payment_status_data', v_payment_status_data,
    'recent_activities', v_recent_activities
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- GRANT EXECUTE permissions to authenticated users
-- ============================================
GRANT EXECUTE ON FUNCTION public.record_spp_payment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_spp_for_class(UUID, UUID, SMALLINT, SMALLINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_savings_deposit(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_savings_withdrawal(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_bill_payment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_bill_with_assignments(TEXT, TEXT, INTEGER, DATE, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
