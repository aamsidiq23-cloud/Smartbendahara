-- ============================================
-- Smart Bendahara — Cron Job Schedule
-- Migration 006: Setup pg_cron for daily reminders
-- ============================================
-- NOTE: pg_cron extension must be enabled in Supabase.
-- Go to Database > Extensions > enable "pg_cron"
-- ============================================

-- Enable pg_cron (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- Schedule: Daily at 08:00 WIB (01:00 UTC)
-- Calls the spp-reminder-cron Edge Function
-- ============================================
-- NOTE: Replace YOUR_SUPABASE_URL and YOUR_SERVICE_ROLE_KEY
-- with actual values from your Supabase project settings.
-- You can also configure these via Supabase Dashboard > Cron Jobs

-- Option A: Via pg_cron + pg_net (recommended)
-- This runs entirely within the database, no external scheduler needed

SELECT cron.schedule(
  'spp-daily-reminder',        -- job name
  '0 1 * * *',                 -- cron expression: 01:00 UTC = 08:00 WIB
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/spp-reminder-cron',
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

-- ============================================
-- Optional: Monitor cron job status
-- ============================================
-- View scheduled jobs:
--   SELECT * FROM cron.job;
--
-- View job run history:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Unschedule a job:
--   SELECT cron.unschedule('spp-daily-reminder');

-- ============================================
-- App Settings (configure in Supabase Dashboard)
-- ============================================
-- These settings are referenced by triggers and cron jobs.
-- Set them in Supabase Dashboard > Project Settings > Database > Connection settings
-- Or via SQL:
--
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
--
-- IMPORTANT: Never commit actual keys to migration files!
-- Use Supabase Vault or Dashboard settings instead.
