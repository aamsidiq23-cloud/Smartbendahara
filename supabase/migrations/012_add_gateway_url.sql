-- Migration: 012_add_gateway_url.sql
-- Description: Adds gateway_url column to wa_configs table to support self-hosted gateways

-- Up Migration
ALTER TABLE "public"."wa_configs"
ADD COLUMN "gateway_url" TEXT;

-- Down Migration (Optional, for rollback)
-- ALTER TABLE "public"."wa_configs"
-- DROP COLUMN "gateway_url";
