-- ============================================
-- Smart Bendahara — Setup Admin Account
-- Run this AFTER 007_fix_permissions_and_seed.sql
-- ============================================
-- 
-- LANGKAH-LANGKAH:
-- 
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Jalankan file 007_fix_permissions_and_seed.sql dulu
-- 3. Lalu buka Authentication → Users → "Add user" → "Create new user"
--    - Email: amsidiq23@gmail.com (atau email Anda)
--    - Password: SmartBendahara2025!
--    - Centang "Auto Confirm User" ← PENTING!
--    - Klik "Create User"
-- 4. Copy User UID yang muncul (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
-- 5. Ganti 'PASTE_AUTH_UID_DISINI' di bawah dengan UID tersebut
-- 6. Jalankan script SQL ini di SQL Editor
-- ============================================

-- Ganti UUID di bawah dengan auth UID yang Anda copy dari langkah 4
DO $$
DECLARE
  v_auth_uid UUID := 'PASTE_AUTH_UID_DISINI'; -- ← GANTI INI!
  v_email TEXT := 'amsidiq23@gmail.com';       -- ← sesuaikan email Anda
  v_school_name TEXT := 'SD Nusantara Jaya';   -- ← sesuaikan nama sekolah
  v_admin_name TEXT := 'Ahmad Sidiq';          -- ← sesuaikan nama admin
  v_result JSON;
BEGIN
  -- Check if user already linked
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_id = v_auth_uid) THEN
    RAISE NOTICE 'User sudah terhubung ke tenant. Skip.';
    RETURN;
  END IF;

  -- Create tenant + user + default data
  v_result := public.handle_new_registration(
    v_school_name,
    v_admin_name,
    v_email,
    v_auth_uid
  );

  RAISE NOTICE 'Berhasil! Data: %', v_result;
END $$;

-- Verify: tampilkan data yang baru dibuat
SELECT 
  u.name AS admin_name,
  u.email,
  u.role,
  t.name AS school_name,
  t.slug,
  t.status,
  t.plan
FROM users u
JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.created_at DESC
LIMIT 5;
