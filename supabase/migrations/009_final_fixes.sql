-- ============================================
-- Smart Bendahara — Final Backend Fixes
-- Migration 009: Role-based RLS, Mass Promotion,
-- Portal RPC, Security Hardening
-- ============================================

-- ============================================
-- 1. ROLE-BASED RLS POLICIES
-- Principal = read-only (SELECT only)
-- Treasurer = CRUD on financial data, no user management
-- Admin = full access within own tenant
-- ============================================

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ============================================
-- 1a. STUDENTS — principal can only SELECT
-- ============================================
-- Drop existing permissive policies that allow any authenticated user to INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "students_insert_own" ON students;
DROP POLICY IF EXISTS "students_update_own" ON students;
DROP POLICY IF EXISTS "students_delete_own" ON students;

-- Recreate with role check: only admin and treasurer can mutate
CREATE POLICY "students_insert_role" ON students
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "students_update_role" ON students
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "students_delete_role" ON students
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- ============================================
-- 1b. SPP_PAYMENTS — principal can only SELECT
-- ============================================
DROP POLICY IF EXISTS "spp_payments_insert_own" ON spp_payments;
DROP POLICY IF EXISTS "spp_payments_update_own" ON spp_payments;

CREATE POLICY "spp_payments_insert_role" ON spp_payments
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "spp_payments_update_role" ON spp_payments
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- ============================================
-- 1c. SAVINGS — principal can only SELECT
-- ============================================
DROP POLICY IF EXISTS "savings_accounts_insert_own" ON savings_accounts;
DROP POLICY IF EXISTS "savings_accounts_update_own" ON savings_accounts;

CREATE POLICY "savings_accounts_insert_role" ON savings_accounts
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "savings_accounts_update_role" ON savings_accounts
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

DROP POLICY IF EXISTS "savings_transactions_insert_own" ON savings_transactions;

CREATE POLICY "savings_transactions_insert_role" ON savings_transactions
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- ============================================
-- 1d. CUSTOM_BILLS / BILL_ASSIGNMENTS / BILL_PAYMENTS
-- ============================================
DROP POLICY IF EXISTS "custom_bills_insert_own" ON custom_bills;
DROP POLICY IF EXISTS "custom_bills_update_own" ON custom_bills;

CREATE POLICY "custom_bills_insert_role" ON custom_bills
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "custom_bills_update_role" ON custom_bills
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

DROP POLICY IF EXISTS "bill_assignments_insert_own" ON bill_assignments;
DROP POLICY IF EXISTS "bill_assignments_update_own" ON bill_assignments;

CREATE POLICY "bill_assignments_insert_role" ON bill_assignments
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "bill_assignments_update_role" ON bill_assignments
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

DROP POLICY IF EXISTS "bill_payments_insert_own" ON bill_payments;

CREATE POLICY "bill_payments_insert_role" ON bill_payments
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- ============================================
-- 1e. USERS — only admin can manage users
-- ============================================
DROP POLICY IF EXISTS "users_insert_own_tenant" ON users;
DROP POLICY IF EXISTS "users_update_own_tenant" ON users;

CREATE POLICY "users_insert_admin_only" ON users
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'admin'
  );

CREATE POLICY "users_update_admin_only" ON users
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'admin'
  );

-- ============================================
-- 1f. TENANTS — only admin can update
-- ============================================
DROP POLICY IF EXISTS "tenants_update_own" ON tenants;

CREATE POLICY "tenants_update_admin_only" ON tenants
  FOR UPDATE USING (
    id = public.get_my_tenant_id()
    AND public.get_my_role() = 'admin'
  );

-- ============================================
-- 1g. WA_CONFIGS — only admin can manage
-- ============================================
DROP POLICY IF EXISTS "wa_configs_insert_own" ON wa_configs;
DROP POLICY IF EXISTS "wa_configs_update_own" ON wa_configs;

CREATE POLICY "wa_configs_insert_admin_only" ON wa_configs
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'admin'
  );

CREATE POLICY "wa_configs_update_admin_only" ON wa_configs
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'admin'
  );

-- ============================================
-- 1h. STUDENT_ENROLLMENTS — admin/treasurer only
-- ============================================
DROP POLICY IF EXISTS "student_enrollments_insert_own" ON student_enrollments;
DROP POLICY IF EXISTS "student_enrollments_update_own" ON student_enrollments;
DROP POLICY IF EXISTS "student_enrollments_delete_own" ON student_enrollments;

CREATE POLICY "student_enrollments_insert_role" ON student_enrollments
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "student_enrollments_update_role" ON student_enrollments
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "student_enrollments_delete_role" ON student_enrollments
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- ============================================
-- 1i. PARENT_CONTACTS — admin/treasurer only for mutations
-- ============================================
DROP POLICY IF EXISTS "parent_contacts_insert_own" ON parent_contacts;
DROP POLICY IF EXISTS "parent_contacts_update_own" ON parent_contacts;
DROP POLICY IF EXISTS "parent_contacts_delete_own" ON parent_contacts;

CREATE POLICY "parent_contacts_insert_role" ON parent_contacts
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "parent_contacts_update_role" ON parent_contacts
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "parent_contacts_delete_role" ON parent_contacts
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- ============================================
-- 1j. CLASSES — admin/treasurer only for mutations
-- ============================================
DROP POLICY IF EXISTS "classes_insert_own" ON classes;
DROP POLICY IF EXISTS "classes_update_own" ON classes;
DROP POLICY IF EXISTS "classes_delete_own" ON classes;

CREATE POLICY "classes_insert_role" ON classes
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "classes_update_role" ON classes
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

CREATE POLICY "classes_delete_role" ON classes
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- ============================================
-- 1k. ACADEMIC_YEARS — admin only for mutations
-- ============================================
DROP POLICY IF EXISTS "academic_years_insert_own" ON academic_years;
DROP POLICY IF EXISTS "academic_years_update_own" ON academic_years;
DROP POLICY IF EXISTS "academic_years_delete_own" ON academic_years;

CREATE POLICY "academic_years_insert_admin_only" ON academic_years
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'admin'
  );

CREATE POLICY "academic_years_update_admin_only" ON academic_years
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'admin'
  );

CREATE POLICY "academic_years_delete_admin_only" ON academic_years
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() = 'admin'
  );


-- ============================================
-- 2. MASS PROMOTE STUDENTS (F-10 — Kenaikan Kelas Massal)
-- Promotes all students from one academic year to the next.
-- Students in the highest grade are marked as alumni.
-- ============================================
CREATE OR REPLACE FUNCTION public.mass_promote_students(
  p_from_academic_year_id UUID,
  p_to_academic_year_id UUID,
  p_grade_mapping JSONB DEFAULT '{}',  -- e.g. {"1":"2","2":"3","3":"4","4":"5","5":"6"}
  p_max_grade TEXT DEFAULT '6'          -- students in this grade become alumni
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_enrollment RECORD;
  v_new_class_id UUID;
  v_promoted INTEGER := 0;
  v_graduated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_new_grade TEXT;
  v_new_class_name TEXT;
BEGIN
  -- Get current user context
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  -- Only admin can promote
  IF public.get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Hanya admin yang bisa melakukan kenaikan kelas massal';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Validate academic years exist and belong to this tenant
  IF NOT EXISTS (SELECT 1 FROM academic_years WHERE id = p_from_academic_year_id AND tenant_id = v_tenant_id) THEN
    RAISE EXCEPTION 'Tahun ajaran asal tidak ditemukan';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM academic_years WHERE id = p_to_academic_year_id AND tenant_id = v_tenant_id) THEN
    RAISE EXCEPTION 'Tahun ajaran tujuan tidak ditemukan';
  END IF;

  -- Loop through all active enrollments in the source academic year
  FOR v_enrollment IN
    SELECT se.id AS enrollment_id, se.student_id, se.class_id,
           c.name AS class_name, c.grade, c.spp_amount
    FROM student_enrollments se
    JOIN classes c ON c.id = se.class_id
    WHERE se.tenant_id = v_tenant_id
      AND se.is_active = TRUE
      AND c.academic_year_id = p_from_academic_year_id
  LOOP
    -- Check if student is in max grade (graduates)
    IF v_enrollment.grade = p_max_grade THEN
      -- Mark student as alumni
      UPDATE students SET status = 'alumni' WHERE id = v_enrollment.student_id;
      -- Deactivate enrollment
      UPDATE student_enrollments SET is_active = FALSE WHERE id = v_enrollment.enrollment_id;
      v_graduated := v_graduated + 1;
      CONTINUE;
    END IF;

    -- Determine new grade from mapping or increment
    v_new_grade := p_grade_mapping ->> v_enrollment.grade;
    IF v_new_grade IS NULL THEN
      -- Auto-increment: try to parse as integer
      BEGIN
        v_new_grade := (v_enrollment.grade::INTEGER + 1)::TEXT;
      EXCEPTION WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END;
    END IF;

    -- Build new class name: replace grade portion
    -- e.g. "4A" with grade "4" → new grade "5" → "5A"
    v_new_class_name := v_new_grade || SUBSTRING(v_enrollment.class_name FROM LENGTH(v_enrollment.grade) + 1);

    -- Find or create the target class in the new academic year
    SELECT id INTO v_new_class_id FROM classes
    WHERE tenant_id = v_tenant_id
      AND academic_year_id = p_to_academic_year_id
      AND name = v_new_class_name;

    IF v_new_class_id IS NULL THEN
      -- Create the class in the new academic year
      INSERT INTO classes (tenant_id, academic_year_id, name, grade, spp_amount)
      VALUES (v_tenant_id, p_to_academic_year_id, v_new_class_name, v_new_grade, v_enrollment.spp_amount)
      RETURNING id INTO v_new_class_id;
    END IF;

    -- Deactivate old enrollment
    UPDATE student_enrollments SET is_active = FALSE WHERE id = v_enrollment.enrollment_id;

    -- Create new enrollment (skip if already exists)
    INSERT INTO student_enrollments (tenant_id, student_id, class_id, is_active)
    VALUES (v_tenant_id, v_enrollment.student_id, v_new_class_id, TRUE)
    ON CONFLICT (student_id, class_id) DO NOTHING;

    -- Create savings account if not exists
    INSERT INTO savings_accounts (tenant_id, student_id, balance)
    VALUES (v_tenant_id, v_enrollment.student_id, 0)
    ON CONFLICT (student_id) DO NOTHING;

    v_promoted := v_promoted + 1;
  END LOOP;

  -- Log activity
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (
    v_tenant_id, v_user_id, 'update', 'student_enrollments', p_to_academic_year_id,
    json_build_object(
      'type', 'mass_promotion',
      'from_year', p_from_academic_year_id,
      'to_year', p_to_academic_year_id,
      'promoted', v_promoted,
      'graduated', v_graduated,
      'skipped', v_skipped
    )
  );

  RETURN json_build_object(
    'success', true,
    'promoted', v_promoted,
    'graduated', v_graduated,
    'skipped', v_skipped
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mass_promote_students(UUID, UUID, JSONB, TEXT) TO authenticated;


-- ============================================
-- 3. PORTAL LOOKUP BY PHONE (Secure RPC for parent portal)
-- Anon-safe: no auth required, lookup by phone number
-- Returns student data, SPP, savings, bills for portal display
-- ============================================
CREATE OR REPLACE FUNCTION public.portal_lookup_by_phone(
  p_phone TEXT
)
RETURNS JSON AS $$
DECLARE
  v_contact parent_contacts%ROWTYPE;
  v_student students%ROWTYPE;
  v_tenant tenants%ROWTYPE;
  v_enrollment RECORD;
  v_savings_account savings_accounts%ROWTYPE;
  v_spp_payments JSON;
  v_savings_transactions JSON;
  v_bill_assignments JSON;
BEGIN
  -- Validate phone
  IF p_phone IS NULL OR LENGTH(p_phone) < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Nomor telepon tidak valid');
  END IF;

  -- Find primary parent contact with this phone
  SELECT * INTO v_contact FROM parent_contacts
  WHERE phone_wa = p_phone AND is_primary = TRUE
  LIMIT 1;

  IF v_contact.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Nomor tidak terdaftar di sistem');
  END IF;

  -- Get student
  SELECT * INTO v_student FROM students WHERE id = v_contact.student_id;
  IF v_student.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Data siswa tidak ditemukan');
  END IF;

  -- Get tenant
  SELECT * INTO v_tenant FROM tenants WHERE id = v_contact.tenant_id;

  -- Get enrollment with class name
  SELECT se.*, c.name AS class_name INTO v_enrollment
  FROM student_enrollments se
  JOIN classes c ON c.id = se.class_id
  WHERE se.student_id = v_student.id AND se.is_active = TRUE
  LIMIT 1;

  -- Get SPP payments
  SELECT COALESCE(json_agg(row_data ORDER BY row_data->>'year', row_data->>'month'), '[]'::json)
  INTO v_spp_payments
  FROM (
    SELECT json_build_object(
      'id', sp.id,
      'month', sp.month,
      'year', sp.year,
      'amount_due', sp.amount_due,
      'amount_paid', sp.amount_paid,
      'remaining', sp.remaining,
      'status', sp.status,
      'paid_at', sp.paid_at
    ) AS row_data
    FROM spp_payments sp
    WHERE sp.student_id = v_student.id AND sp.tenant_id = v_contact.tenant_id
  ) sub;

  -- Get savings
  SELECT * INTO v_savings_account FROM savings_accounts
  WHERE student_id = v_student.id AND tenant_id = v_contact.tenant_id;

  -- Get savings transactions (last 20)
  IF v_savings_account.id IS NOT NULL THEN
    SELECT COALESCE(json_agg(row_data ORDER BY row_data->>'transacted_at' DESC), '[]'::json)
    INTO v_savings_transactions
    FROM (
      SELECT json_build_object(
        'id', st.id,
        'type', st.type,
        'amount', st.amount,
        'balance_after', st.balance_after,
        'notes', st.notes,
        'transacted_at', st.transacted_at
      ) AS row_data
      FROM savings_transactions st
      WHERE st.savings_account_id = v_savings_account.id
      LIMIT 20
    ) sub;
  ELSE
    v_savings_transactions := '[]'::json;
  END IF;

  -- Get bill assignments with bill info
  SELECT COALESCE(json_agg(row_data), '[]'::json)
  INTO v_bill_assignments
  FROM (
    SELECT json_build_object(
      'id', ba.id,
      'amount_due', ba.amount_due,
      'amount_paid', ba.amount_paid,
      'remaining', ba.remaining,
      'status', ba.status,
      'bill_name', cb.name,
      'bill_description', cb.description,
      'due_date', cb.due_date
    ) AS row_data
    FROM bill_assignments ba
    JOIN custom_bills cb ON cb.id = ba.custom_bill_id
    WHERE ba.student_id = v_student.id AND ba.tenant_id = v_contact.tenant_id
      AND cb.status = 'active'
  ) sub;

  RETURN json_build_object(
    'success', true,
    'student', json_build_object(
      'id', v_student.id,
      'name', v_student.name,
      'nisn', v_student.nisn,
      'status', v_student.status
    ),
    'class_name', COALESCE(v_enrollment.class_name, '-'),
    'tenant_name', v_tenant.name,
    'tenant_logo', v_tenant.logo_url,
    'spp_payments', v_spp_payments,
    'savings_account', CASE
      WHEN v_savings_account.id IS NOT NULL THEN
        json_build_object(
          'id', v_savings_account.id,
          'balance', v_savings_account.balance,
          'updated_at', v_savings_account.updated_at
        )
      ELSE NULL
    END,
    'savings_transactions', v_savings_transactions,
    'bill_assignments', v_bill_assignments
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anon access (portal doesn't require login)
GRANT EXECUTE ON FUNCTION public.portal_lookup_by_phone(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.portal_lookup_by_phone(TEXT) TO authenticated;


-- ============================================
-- 4. UPDATE USER ROLE (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_target_user users%ROWTYPE;
BEGIN
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  IF public.get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Hanya admin yang bisa mengubah role pengguna';
  END IF;

  IF p_new_role NOT IN ('admin', 'treasurer', 'principal') THEN
    RAISE EXCEPTION 'Role tidak valid. Pilih: admin, treasurer, atau principal';
  END IF;

  SELECT id INTO v_admin_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Get target user (must be same tenant)
  SELECT * INTO v_target_user FROM users
  WHERE id = p_user_id AND tenant_id = v_tenant_id;

  IF v_target_user.id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan';
  END IF;

  -- Prevent admin from demoting themselves if they're the only admin
  IF v_target_user.id = v_admin_user_id AND p_new_role != 'admin' THEN
    IF (SELECT COUNT(*) FROM users WHERE tenant_id = v_tenant_id AND role = 'admin' AND is_active = TRUE) <= 1 THEN
      RAISE EXCEPTION 'Tidak bisa mengubah role Anda sendiri. Minimal harus ada 1 admin aktif.';
    END IF;
  END IF;

  -- Update role
  UPDATE users SET role = p_new_role WHERE id = p_user_id;

  -- Log
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (
    v_tenant_id, v_admin_user_id, 'update', 'users', p_user_id,
    json_build_object('role', v_target_user.role),
    json_build_object('role', p_new_role)
  );

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_role', v_target_user.role,
    'new_role', p_new_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;


-- ============================================
-- 5. ADD USER TO TENANT (admin only)
-- Creates a new user in the tenant (requires separate auth user creation)
-- ============================================
CREATE OR REPLACE FUNCTION public.add_user_to_tenant(
  p_name TEXT,
  p_email TEXT,
  p_role TEXT DEFAULT 'treasurer',
  p_auth_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_new_user_id UUID;
BEGIN
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  IF public.get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Hanya admin yang bisa menambah pengguna';
  END IF;

  IF p_role NOT IN ('admin', 'treasurer', 'principal') THEN
    RAISE EXCEPTION 'Role tidak valid';
  END IF;

  SELECT id INTO v_admin_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Check if email already exists in this tenant
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email AND tenant_id = v_tenant_id) THEN
    RAISE EXCEPTION 'Email sudah terdaftar di sekolah ini';
  END IF;

  -- Create user
  INSERT INTO users (tenant_id, auth_id, name, email, role, is_active)
  VALUES (v_tenant_id, p_auth_id, p_name, p_email, p_role, TRUE)
  RETURNING id INTO v_new_user_id;

  -- Log
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (
    v_tenant_id, v_admin_user_id, 'create', 'users', v_new_user_id,
    json_build_object('name', p_name, 'email', p_email, 'role', p_role)
  );

  RETURN json_build_object(
    'success', true,
    'user_id', v_new_user_id,
    'name', p_name,
    'email', p_email,
    'role', p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.add_user_to_tenant(TEXT, TEXT, TEXT, UUID) TO authenticated;


-- ============================================
-- 6. GRANT get_my_role to all
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;
