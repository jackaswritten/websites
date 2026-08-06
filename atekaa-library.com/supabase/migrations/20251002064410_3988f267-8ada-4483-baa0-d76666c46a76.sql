-- Drop the old constraint that only checks date
ALTER TABLE public.applications 
DROP CONSTRAINT IF EXISTS unique_application_date;

-- Add the correct constraint that checks both date AND class level
ALTER TABLE public.applications 
ADD CONSTRAINT unique_date_and_class 
UNIQUE (application_date, class_level);