-- ============================================================================
-- Migration 008 — Cover gradient / solid-color option for the business cover
-- Run in the Supabase SQL Editor. Additive & idempotent (safe to re-run).
-- NOTE: not applied automatically — apply manually when ready.
-- ============================================================================

-- We keep the existing `cover_url` column for uploaded images and ADD a new
-- column that stores a CSS background value (either a solid "#hex" or a full
-- "linear-gradient(...)" string). It is used only when cover_url is empty.
--
-- Render priority everywhere (dashboard + public vitrine):
--   cover_url  >  cover_gradient  >  default (#0a0d14)

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS cover_gradient TEXT;

COMMENT ON COLUMN public.businesses.cover_gradient IS
  'CSS background (solid #hex or linear-gradient(...)) shown when cover_url is empty. Priority: cover_url > cover_gradient > #0a0d14.';
