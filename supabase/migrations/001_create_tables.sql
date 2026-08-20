-- ============================================
-- Smart Bendahara — Database Schema
-- Migration 001: Create all 16 tables
-- Based on PRD v2.0 Section 8 (ERD)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TENANTS — Data setiap sekolah
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  npsn VARCHAR(20),
  education_level VARCHAR(20) CHECK (education_level IN ('SD', 'SMP', 'SMA', 'SMK', 'MI', 'MTs', 'MA')),
  plan VARCHAR(20) NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  spp_due_day SMALLINT DEFAULT 10 CHECK (spp_due_day BETWEEN 1 AND 28),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. USERS — Pengguna dashboard sekolah
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_id UUID UNIQUE, -- References Supabase auth.users.id
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'treasurer', 'principal')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email, tenant_id)
);

-- ============================================
-- 3. WA_CONFIGS — Konfigurasi WhatsApp gateway
-- ============================================
CREATE TABLE wa_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  gateway VARCHAR(20) DEFAULT 'fonnte' CHECK (gateway IN ('fonnte', 'wablas', 'other')),
  api_key TEXT,
  sender_number VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_h_minus_3 BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_h_0 BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_h_plus_7 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. ACADEMIC_YEARS — Tahun ajaran
-- ============================================
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(20) NOT NULL, -- e.g. "2024/2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- ============================================
-- 5. CLASSES — Kelas per tahun ajaran
-- ============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(20) NOT NULL, -- e.g. "4A", "7B"
  grade VARCHAR(5) NOT NULL, -- e.g. "4", "7"
  spp_amount INTEGER NOT NULL DEFAULT 0 CHECK (spp_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, academic_year_id, name)
);

-- ============================================
-- 6. STUDENTS — Data siswa
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nisn VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'alumni', 'transferred')),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, nisn)
);

-- ============================================
-- 7. STUDENT_ENROLLMENTS — Penempatan siswa di kelas
-- ============================================
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- ============================================
-- 8. PARENT_CONTACTS — Kontak orang tua/wali
-- ============================================
CREATE TABLE parent_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(20) DEFAULT 'mother' CHECK (relationship IN ('mother', 'father', 'guardian')),
  phone_wa VARCHAR(20),
  wa_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. SPP_PAYMENTS — Pembayaran SPP
-- ============================================
CREATE TABLE spp_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year SMALLINT NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  amount_due INTEGER NOT NULL CHECK (amount_due >= 0),
  amount_paid INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  remaining INTEGER GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
  status VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  recorded_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, student_id, academic_year_id, month, year)
);

-- ============================================
-- 10. SAVINGS_ACCOUNTS — Rekening tabungan siswa
-- ============================================
CREATE TABLE savings_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. SAVINGS_TRANSACTIONS — Transaksi tabungan
-- ============================================
CREATE TABLE savings_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  savings_account_id UUID NOT NULL REFERENCES savings_accounts(id) ON DELETE CASCADE,
  type VARCHAR(15) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  transacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. CUSTOM_BILLS — Tagihan insidental
-- ============================================
CREATE TABLE custom_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_amount INTEGER NOT NULL CHECK (default_amount >= 0),
  due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. BILL_ASSIGNMENTS — Penugasan tagihan ke siswa
-- ============================================
CREATE TABLE bill_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  custom_bill_id UUID NOT NULL REFERENCES custom_bills(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount_due INTEGER NOT NULL CHECK (amount_due >= 0),
  amount_paid INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  remaining INTEGER GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
  status VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(custom_bill_id, student_id)
);

-- ============================================
-- 14. BILL_PAYMENTS — Riwayat pembayaran tagihan
-- ============================================
CREATE TABLE bill_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bill_assignment_id UUID NOT NULL REFERENCES bill_assignments(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  recorded_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. NOTIFICATION_LOGS — Log notifikasi WA
-- ============================================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
    'spp_paid', 'savings_deposit', 'savings_withdrawal',
    'bill_created', 'bill_paid',
    'spp_reminder_h3', 'spp_reminder_h0', 'spp_overdue_h7'
  )),
  recipient_phone VARCHAR(20),
  message_sent TEXT,
  status VARCHAR(25) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'delivered', 'skipped_no_gateway')),
  retry_count SMALLINT NOT NULL DEFAULT 0 CHECK (retry_count <= 3),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 16. ACTIVITY_LOGS — Audit trail
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'export', 'login', 'logout')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES — untuk performa query
-- ============================================

-- Tenant-based indexes (used heavily with RLS)
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_academic_years_tenant ON academic_years(tenant_id);
CREATE INDEX idx_classes_tenant ON classes(tenant_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX idx_students_tenant ON students(tenant_id);
CREATE INDEX idx_student_enrollments_tenant ON student_enrollments(tenant_id);
CREATE INDEX idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_class ON student_enrollments(class_id);
CREATE INDEX idx_parent_contacts_student ON parent_contacts(student_id);
CREATE INDEX idx_parent_contacts_tenant ON parent_contacts(tenant_id);
CREATE INDEX idx_spp_payments_tenant ON spp_payments(tenant_id);
CREATE INDEX idx_spp_payments_student ON spp_payments(student_id);
CREATE INDEX idx_spp_payments_status ON spp_payments(tenant_id, status);
CREATE INDEX idx_spp_payments_month_year ON spp_payments(tenant_id, year, month);
CREATE INDEX idx_savings_accounts_tenant ON savings_accounts(tenant_id);
CREATE INDEX idx_savings_transactions_tenant ON savings_transactions(tenant_id);
CREATE INDEX idx_savings_transactions_account ON savings_transactions(savings_account_id);
CREATE INDEX idx_custom_bills_tenant ON custom_bills(tenant_id);
CREATE INDEX idx_bill_assignments_tenant ON bill_assignments(tenant_id);
CREATE INDEX idx_bill_assignments_bill ON bill_assignments(custom_bill_id);
CREATE INDEX idx_bill_assignments_student ON bill_assignments(student_id);
CREATE INDEX idx_bill_payments_tenant ON bill_payments(tenant_id);
CREATE INDEX idx_bill_payments_assignment ON bill_payments(bill_assignment_id);
CREATE INDEX idx_notification_logs_tenant ON notification_logs(tenant_id);
CREATE INDEX idx_notification_logs_student ON notification_logs(student_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(tenant_id, status);
CREATE INDEX idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(tenant_id, created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER — auto-update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON wa_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON spp_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON savings_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON custom_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bill_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
