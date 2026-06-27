-- Add a version_id column to the trips table for Optimistic Concurrency Control
-- This completely prevents the "Lost Update" race condition in the Admin Panel.

ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS version_id INT NOT NULL DEFAULT 1;

-- If you already have existing rows, they will automatically be assigned version_id = 1 
-- because of the DEFAULT constraint.
