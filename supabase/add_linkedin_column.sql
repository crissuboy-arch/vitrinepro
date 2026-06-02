-- Migration: add linkedin column to businesses table
-- Run this in the Supabase SQL Editor if the table already exists

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS linkedin TEXT;
