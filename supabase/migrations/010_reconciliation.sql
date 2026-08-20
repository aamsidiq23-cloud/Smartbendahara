-- ============================================
-- Smart Bendahara — Cash Reconciliation & WA Retry
-- Migration 010: F-13 Rekonsiliasi Kas + WA Retry Cron
-- ============================================

-- ============================================
-- 1. CASH RECONCILIATIONS TABLE
-- Menyimpan setiap sesi rekonsiliasi kas
-- PRD F-13: Kas sistem vs fisik vs selisih
-- ============================================
CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reconciled_by UUID NOT NULL REFERENCES users(id),
  reconciliation_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Kas dari sistem (dihitung otomatis)
  system_spp_income INTEGER NOT NULL DEFAULT 0,         -- Total SPP paid dalam periode
  system_bill_income INTEGER NOT NULL DEFAULT 0,         -- Total tagihan paid dalam periode
  system_savings_withdrawal INTEGER NOT NULL DEFAULT 0,  -- Total penarikan tabungan
  system_savings_deposit INTEGER NOT NULL DEFAULT 0,     -- Total setoran tabungan
  system_cash INTEGER NOT NULL DEFAULT 0,                -- Total kas sistem (spp + bill - savings net)

  -- Kas fisik (input manual)
  physical_cash INTEGER NOT NULL DEFAULT 0 CHECK (physical_cash >= 0),

  -- Selisih
  difference INTEGER GENERATED ALWAYS AS (physical_cash - system_cash) STORED,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'balanced' CHECK (status IN ('balanced', 'discrepancy')),

  -- Catatan penjelasan (wajib jika ada selisih)
  notes TEXT,

  -- Periode rekonsiliasi
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX idx_cash_reconciliations_tenant ON cash_reconciliations(tenant_id);
CREATE INDEX idx_cash_reconciliations_date ON cash_reconciliations(tenant_id, reconciliation_date DESC);
CREATE INDEX idx_cash_reconciliations_reconciled_by ON cash_reconciliations(reconciled_by);

-- ============================================
-- 3. ROW-LEVEL SECURITY
-- ============================================
ALTER TABLE cash_reconciliations ENABLE ROW LEVEL SECURITY;

-- SELECT: all tenant users can view
CREATE POLICY "cash_reconciliations_select_own" ON cash_reconciliations
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- INSERT: only admin and treasurer
CREATE POLICY "cash_reconciliations_insert_role" ON cash_reconciliations
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- UPDATE: only admin and treasurer
CREATE POLICY "cash_reconciliations_update_role" ON cash_reconciliations
  FOR UPDATE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'treasurer')
  );

-- ============================================
-- 4. RPC: PERFORM RECONCILIATION
-- Hitung kas sistem secara otomatis, bandingkan dengan kas fisik,
-- simpan hasil rekonsiliasi + activity log
-- ============================================
CREATE OR REPLACE FUNCTION public.perform_reconciliation(
  p_physical_cash INTEGER,
  p_period_start DATE,
  p_period_end DATE,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_spp_income INTEGER;
  v_bill_income INTEGER;
  v_savings_deposit INTEGER;
  v_savings_withdrawal INTEGER;
  v_system_cash INTEGER;
  v_difference INTEGER;
  v_status VARCHAR(20);
  v_recon_id UUID;
BEGIN
  -- Get current user context
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  -- Only admin/treasurer can reconcile
  IF public.get_my_role() NOT IN ('admin', 'treasurer') THEN
    RAISE EXCEPTION 'Hanya admin atau bendahara yang bisa melakukan rekonsiliasi';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid() LIMIT 1;

  -- Validate physical cash
  IF p_physical_cash < 0 THEN
    RAISE EXCEPTION 'Kas fisik tidak boleh negatif';
  END IF;

  -- Validate period
  IF p_period_start > p_period_end THEN
    RAISE EXCEPTION 'Tanggal awal harus sebelum tanggal akhir';
  END IF;

  -- ============================================
  -- Calculate system cash for the period
  -- ============================================

  -- Total SPP payments received in period
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_spp_income
  FROM spp_payments
  WHERE tenant_id = v_tenant_id
    AND status IN ('paid', 'partial')
    AND paid_at >= p_period_start::timestamptz
    AND paid_at < (p_period_end + INTERVAL '1 day')::timestamptz;

  -- Total bill payments received in period
  SELECT COALESCE(SUM(bp.amount), 0) INTO v_bill_income
  FROM bill_payments bp
  WHERE bp.tenant_id = v_tenant_id
    AND bp.paid_at >= p_period_start::timestamptz
    AND bp.paid_at < (p_period_end + INTERVAL '1 day')::timestamptz;

  -- Total savings deposits in period (money comes IN from students)
  SELECT COALESCE(SUM(amount), 0) INTO v_savings_deposit
  FROM savings_transactions
  WHERE tenant_id = v_tenant_id
    AND type = 'deposit'
    AND transacted_at >= p_period_start::timestamptz
    AND transacted_at < (p_period_end + INTERVAL '1 day')::timestamptz;

  -- Total savings withdrawals in period (money goes OUT to students)
  SELECT COALESCE(SUM(amount), 0) INTO v_savings_withdrawal
  FROM savings_transactions
  WHERE tenant_id = v_tenant_id
    AND type = 'withdrawal'
    AND transacted_at >= p_period_start::timestamptz
    AND transacted_at < (p_period_end + INTERVAL '1 day')::timestamptz;

  -- System cash = income from SPP + bills + savings deposits - savings withdrawals
  -- (tabungan: uang masuk ke sekolah saat setor, keluar saat tarik)
  v_system_cash := v_spp_income + v_bill_income + v_savings_deposit - v_savings_withdrawal;

  -- Calculate difference
  v_difference := p_physical_cash - v_system_cash;

  -- Determine status
  IF v_difference = 0 THEN
    v_status := 'balanced';
  ELSE
    v_status := 'discrepancy';
    -- Notes wajib jika ada selisih
    IF p_notes IS NULL OR TRIM(p_notes) = '' THEN
      RAISE EXCEPTION 'Catatan penjelasan wajib diisi jika ada selisih kas (selisih: Rp %)', ABS(v_difference);
    END IF;
  END IF;

  -- Insert reconciliation record
  INSERT INTO cash_reconciliations (
    tenant_id, reconciled_by, reconciliation_date,
    system_spp_income, system_bill_income,
    system_savings_deposit, system_savings_withdrawal,
    system_cash, physical_cash,
    status, notes,
    period_start, period_end
  ) VALUES (
    v_tenant_id, v_user_id, CURRENT_DATE,
    v_spp_income, v_bill_income,
    v_savings_deposit, v_savings_withdrawal,
    v_system_cash, p_physical_cash,
    v_status, p_notes,
    p_period_start, p_period_end
  ) RETURNING id INTO v_recon_id;

  -- Log activity
  INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (
    v_tenant_id, v_user_id, 'create', 'cash_reconciliations', v_recon_id,
    json_build_object(
      'type', 'reconciliation',
      'system_cash', v_system_cash,
      'physical_cash', p_physical_cash,
      'difference', v_difference,
      'status', v_status,
      'period', p_period_start || ' - ' || p_period_end
    )
  );

  RETURN json_build_object(
    'success', true,
    'reconciliation_id', v_recon_id,
    'system_cash', v_system_cash,
    'physical_cash', p_physical_cash,
    'difference', v_difference,
    'status', v_status,
    'breakdown', json_build_object(
      'spp_income', v_spp_income,
      'bill_income', v_bill_income,
      'savings_deposit', v_savings_deposit,
      'savings_withdrawal', v_savings_withdrawal
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.perform_reconciliation(INTEGER, DATE, DATE, TEXT) TO authenticated;

-- ============================================
-- 5. RPC: GET RECONCILIATION HISTORY
-- Fetch riwayat rekonsiliasi per tenant
-- ============================================
CREATE OR REPLACE FUNCTION public.get_reconciliation_history(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_tenant_id UUID;
  v_records JSON;
  v_total INTEGER;
BEGIN
  v_tenant_id := public.get_my_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User tidak terautentikasi';
  END IF;

  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM cash_reconciliations
  WHERE tenant_id = v_tenant_id;

  -- Get records
  SELECT COALESCE(json_agg(row_data), '[]'::json) INTO v_records
  FROM (
    SELECT json_build_object(
      'id', cr.id,
      'reconciliation_date', cr.reconciliation_date,
      'system_spp_income', cr.system_spp_income,
      'system_bill_income', cr.system_bill_income,
      'system_savings_deposit', cr.system_savings_deposit,
      'system_savings_withdrawal', cr.system_savings_withdrawal,
      'system_cash', cr.system_cash,
      'physical_cash', cr.physical_cash,
      'difference', cr.difference,
      'status', cr.status,
      'notes', cr.notes,
      'period_start', cr.period_start,
      'period_end', cr.period_end,
      'reconciled_by_name', u.name,
      'created_at', cr.created_at
    ) AS row_data
    FROM cash_reconciliations cr
    LEFT JOIN users u ON u.id = cr.reconciled_by
    WHERE cr.tenant_id = v_tenant_id
    ORDER BY cr.reconciliation_date DESC, cr.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN json_build_object(
    'success', true,
    'total', v_total,
    'records', v_records
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_reconciliation_history(INTEGER, INTEGER) TO authenticated;


-- ============================================
-- 6. PG_CRON: WA RETRY SCHEDULER
-- Jalankan setiap 5 menit untuk retry notifikasi gagal
-- ============================================
SELECT cron.schedule(
  'wa-notification-retry',       -- job name
  '*/5 * * * *',                 -- every 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/retry-wa-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'triggered_by', 'pg_cron',
      'scheduled_at', NOW()::text
    )
  );
  $$
);
