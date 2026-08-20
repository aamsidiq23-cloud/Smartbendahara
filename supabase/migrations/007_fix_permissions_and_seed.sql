-- ============================================
-- Smart Bendahara — Fix Permissions & Auth Flow
-- Migration 007: Fix RPC permissions + auto-link auth users
-- ============================================

-- ============================================
-- 1. GRANT EXECUTE on registration/profile functions
-- These were missing from the original migrations!
-- ============================================

-- Allow anon users to call handle_new_registration (needed during signup)
GRANT EXECUTE ON FUNCTION public.handle_new_registration(TEXT, TEXT, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_registration(TEXT, TEXT, TEXT, UUID) TO authenticated;

-- Allow authenticated users to call get_user_profile
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;

-- Allow authenticated users to call get_my_tenant_id (used by RLS)
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO anon;

-- ============================================
-- 2. Clean up orphaned test data (from accidental RPC call)
-- ============================================
DELETE FROM wa_configs WHERE tenant_id IN (
  SELECT id FROM tenants WHERE name = 'test'
);
DELETE FROM academic_years WHERE tenant_id IN (
  SELECT id FROM tenants WHERE name = 'test'
);
DELETE FROM users WHERE tenant_id IN (
  SELECT id FROM tenants WHERE name = 'test'
);
DELETE FROM tenants WHERE name = 'test';

-- ============================================
-- 3. AUTO-LINK TRIGGER: When a Supabase auth user confirms email,
-- check if they have pending registration data and link them
-- ============================================

-- Create a trigger function that runs when auth user is created/updated
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  v_meta JSONB;
  v_school_name TEXT;
  v_admin_name TEXT;
  v_email TEXT;
BEGIN
  -- Get user metadata from auth
  v_meta := NEW.raw_user_meta_data;
  v_school_name := v_meta->>'school_name';
  v_admin_name := v_meta->>'admin_name';
  v_email := NEW.email;

  -- Only proceed if school_name exists in metadata AND user doesn't exist yet
  IF v_school_name IS NOT NULL AND v_school_name != '' THEN
    -- Check if this auth user already has an app user
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_id = NEW.id) THEN
      -- Call the registration function to create tenant + user
      PERFORM public.handle_new_registration(
        v_school_name,
        COALESCE(v_admin_name, 'Admin'),
        v_email,
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block auth flow if registration fails
    RAISE WARNING 'handle_auth_user_created failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- ============================================
-- 4. GRANT SELECT on tenants for anon (needed for portal)
-- ============================================
CREATE POLICY "tenants_select_anon" ON tenants
  FOR SELECT TO anon
  USING (true);

-- Drop the policy if it causes conflict (idempotent)
-- We'll use IF NOT EXISTS pattern via DO block
DO $$
BEGIN
  -- Check if policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'parent_contacts' AND policyname = 'parent_contacts_select_anon_by_phone'
  ) THEN
    CREATE POLICY "parent_contacts_select_anon_by_phone" ON parent_contacts
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;
