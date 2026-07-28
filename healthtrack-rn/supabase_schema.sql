-- HealthTrack Hub - Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  phone_number TEXT,
  address TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  emergency_contact_name TEXT,
  emergency_contact_number TEXT,
  is_dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Medicines table
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  type TEXT,
  frequency TEXT,
  reminder_time TEXT,
  period TEXT,
  recurring BOOLEAN DEFAULT true,
  remaining_quantity INTEGER DEFAULT 0,
  total_adherence_count INTEGER DEFAULT 0,
  missed_count INTEGER DEFAULT 0,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Health logs table
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  heart_rate INTEGER,
  blood_sugar NUMERIC,
  weight NUMERIC,
  sleep_hours NUMERIC,
  water_intake_ml INTEGER,
  steps INTEGER,
  body_temp NUMERIC,
  oxygen_saturation INTEGER,
  timestamp BIGINT,
  date_string TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Mood logs table
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT,
  notes TEXT,
  timestamp BIGINT,
  date_string TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Medication logs table
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE SET NULL,
  medicine_name TEXT,
  status TEXT,
  timestamp BIGINT,
  date_string TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Medicines
CREATE POLICY "Users can view own medicines" ON public.medicines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicines" ON public.medicines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medicines" ON public.medicines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medicines" ON public.medicines FOR DELETE USING (auth.uid() = user_id);

-- Health logs
CREATE POLICY "Users can view own health_logs" ON public.health_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health_logs" ON public.health_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health_logs" ON public.health_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health_logs" ON public.health_logs FOR DELETE USING (auth.uid() = user_id);

-- Mood logs
CREATE POLICY "Users can view own mood_logs" ON public.mood_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mood_logs" ON public.mood_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mood_logs" ON public.mood_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mood_logs" ON public.mood_logs FOR DELETE USING (auth.uid() = user_id);

-- Medication logs
CREATE POLICY "Users can view own medication_logs" ON public.medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medication_logs" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medication_logs" ON public.medication_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medication_logs" ON public.medication_logs FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, age, gender, blood_group)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    (NEW.raw_user_meta_data ->> 'age')::INTEGER,
    NEW.raw_user_meta_data ->> 'gender',
    NEW.raw_user_meta_data ->> 'blood_group'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
