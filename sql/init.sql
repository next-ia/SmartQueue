-- Create patients table
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'cancelled', 'completed'))
);

-- Create queue table
CREATE TABLE queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  estimated_wait_time INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_name TEXT NOT NULL,
  average_consultation_time INTEGER NOT NULL, -- in minutes
  working_hours_start TIME NOT NULL,
  working_hours_end TIME NOT NULL
);

-- Insert default settings
INSERT INTO settings (clinic_name, average_consultation_time, working_hours_start, working_hours_end)
VALUES ('Cabinet Médical SmartQueue', 15, '09:00', '17:00');

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;