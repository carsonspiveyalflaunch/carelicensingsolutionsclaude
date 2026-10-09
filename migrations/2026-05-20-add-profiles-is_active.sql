-- Migration: Add is_active boolean flag to profiles
-- Run this in your Supabase SQL editor or psql against the database

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Optional: set existing active users to true if needed
-- UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
