-- ============================================
-- Smart Bendahara — Row-Level Security (RLS)
-- Migration 002: Enable RLS on all tables
-- Ensures zero cross-tenant data leakage
-- ============================================

-- ============================================
-- Helper function: get tenant_id for current user
-- Looks up tenant_id from the users table using auth.uid()
-- This avoids needing to store tenant_id in JWT claims
-- ============================================
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- TENANTS — Only own tenant visible
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (id = public.get_my_tenant_id());

CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE USING (id = public.get_my_tenant_id());

-- ============================================
-- USERS — Only same-tenant users visible
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_tenant" ON users
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "users_insert_own_tenant" ON users
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "users_update_own_tenant" ON users
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- WA_CONFIGS — Only own tenant config
-- ============================================
ALTER TABLE wa_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_configs_select_own" ON wa_configs
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "wa_configs_insert_own" ON wa_configs
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "wa_configs_update_own" ON wa_configs
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- ACADEMIC_YEARS
-- ============================================
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academic_years_select_own" ON academic_years
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "academic_years_insert_own" ON academic_years
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "academic_years_update_own" ON academic_years
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "academic_years_delete_own" ON academic_years
  FOR DELETE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- CLASSES
-- ============================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select_own" ON classes
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "classes_insert_own" ON classes
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "classes_update_own" ON classes
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "classes_delete_own" ON classes
  FOR DELETE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- STUDENTS
-- ============================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select_own" ON students
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "students_insert_own" ON students
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "students_update_own" ON students
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "students_delete_own" ON students
  FOR DELETE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- STUDENT_ENROLLMENTS
-- ============================================
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_enrollments_select_own" ON student_enrollments
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "student_enrollments_insert_own" ON student_enrollments
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "student_enrollments_update_own" ON student_enrollments
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "student_enrollments_delete_own" ON student_enrollments
  FOR DELETE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- PARENT_CONTACTS
-- ============================================
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_contacts_select_own" ON parent_contacts
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "parent_contacts_insert_own" ON parent_contacts
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "parent_contacts_update_own" ON parent_contacts
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "parent_contacts_delete_own" ON parent_contacts
  FOR DELETE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- SPP_PAYMENTS
-- ============================================
ALTER TABLE spp_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spp_payments_select_own" ON spp_payments
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "spp_payments_insert_own" ON spp_payments
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "spp_payments_update_own" ON spp_payments
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- SAVINGS_ACCOUNTS
-- ============================================
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_accounts_select_own" ON savings_accounts
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "savings_accounts_insert_own" ON savings_accounts
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "savings_accounts_update_own" ON savings_accounts
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- SAVINGS_TRANSACTIONS
-- ============================================
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_transactions_select_own" ON savings_transactions
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "savings_transactions_insert_own" ON savings_transactions
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

-- ============================================
-- CUSTOM_BILLS
-- ============================================
ALTER TABLE custom_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_bills_select_own" ON custom_bills
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "custom_bills_insert_own" ON custom_bills
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "custom_bills_update_own" ON custom_bills
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- BILL_ASSIGNMENTS
-- ============================================
ALTER TABLE bill_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bill_assignments_select_own" ON bill_assignments
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "bill_assignments_insert_own" ON bill_assignments
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "bill_assignments_update_own" ON bill_assignments
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

-- ============================================
-- BILL_PAYMENTS
-- ============================================
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bill_payments_select_own" ON bill_payments
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "bill_payments_insert_own" ON bill_payments
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

-- ============================================
-- NOTIFICATION_LOGS
-- ============================================
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_logs_select_own" ON notification_logs
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "notification_logs_insert_own" ON notification_logs
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

-- ============================================
-- ACTIVITY_LOGS
-- ============================================
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select_own" ON activity_logs
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "activity_logs_insert_own" ON activity_logs
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

-- ============================================
-- REGISTRATION FUNCTION
-- Bypasses RLS for new tenant + user creation during signup
-- Uses SECURITY DEFINER to run with elevated privileges
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_registration(
  p_school_name TEXT,
  p_admin_name TEXT,
  p_email TEXT,
  p_auth_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_slug TEXT;
BEGIN
  -- Generate URL-friendly slug from school name
  v_slug := lower(regexp_replace(p_school_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);

  -- Create tenant
  INSERT INTO tenants (name, slug, email, status, plan)
  VALUES (p_school_name, v_slug, p_email, 'trial', 'starter')
  RETURNING id INTO v_tenant_id;

  -- Create user linked to auth
  INSERT INTO users (tenant_id, auth_id, name, email, role)
  VALUES (v_tenant_id, p_auth_id, p_admin_name, p_email, 'admin')
  RETURNING id INTO v_user_id;

  -- Create default WA config (inactive)
  INSERT INTO wa_configs (tenant_id, is_active)
  VALUES (v_tenant_id, FALSE);

  -- Create default academic year
  INSERT INTO academic_years (tenant_id, name, start_date, end_date, is_active)
  VALUES (
    v_tenant_id,
    TO_CHAR(NOW(), 'YYYY') || '/' || TO_CHAR(NOW() + INTERVAL '1 year', 'YYYY'),
    DATE_TRUNC('month', NOW())::date,
    (DATE_TRUNC('month', NOW()) + INTERVAL '1 year')::date,
    TRUE
  );

  RETURN json_build_object(
    'tenant_id', v_tenant_id,
    'user_id', v_user_id,
    'slug', v_slug
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get current user's profile + tenant
-- Used after login to load user context
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', u.id,
    'tenant_id', u.tenant_id,
    'name', u.name,
    'email', u.email,
    'role', u.role,
    'tenant_name', t.name,
    'tenant_slug', t.slug,
    'tenant_plan', t.plan,
    'tenant_status', t.status,
    'tenant_logo', t.logo_url,
    'tenant_spp_due_day', t.spp_due_day
  ) INTO v_result
  FROM users u
  JOIN tenants t ON t.id = u.tenant_id
  WHERE u.auth_id = auth.uid()
  AND u.is_active = TRUE
  LIMIT 1;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
