-- Create applications table for teacher reservations
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  application_date DATE NOT NULL,
  class_level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_application_date UNIQUE (application_date)
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert applications (teachers submitting)
CREATE POLICY "Anyone can submit applications" 
  ON public.applications 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to view applications (for admin dashboard and conflict checking)
CREATE POLICY "Anyone can view applications" 
  ON public.applications 
  FOR SELECT 
  USING (true);

-- Create index on application_date for faster conflict checking
CREATE INDEX idx_applications_date ON public.applications(application_date);