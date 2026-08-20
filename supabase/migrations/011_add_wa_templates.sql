-- Migration 011: Add custom templates to wa_configs
ALTER TABLE wa_configs
ADD COLUMN template_spp_paid TEXT,
ADD COLUMN template_savings_deposit TEXT,
ADD COLUMN template_savings_withdrawal TEXT,
ADD COLUMN template_bill_created TEXT,
ADD COLUMN template_bill_paid TEXT,
ADD COLUMN template_spp_reminder_h3 TEXT,
ADD COLUMN template_spp_reminder_h0 TEXT,
ADD COLUMN template_spp_overdue_h7 TEXT;
