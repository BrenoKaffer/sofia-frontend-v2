-- Add governance columns to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add governance columns to modules table
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- Update RLS policies (optional but recommended) to only show published content to normal users
-- This would require updating existing policies. For now, we will handle this in the application layer (API queries).
