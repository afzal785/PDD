# Supabase Setup Guide for HealthTrack

This guide explains how to set up your Supabase backend for the HealthTrack React Native application. Follow these instructions step-by-step to configure your database, authentication, and security policies.

---

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in or create a free account.
2. In the Supabase Dashboard, click **New Project**.
3. Choose your organization, enter a name (e.g., `HealthTrack`), set a secure Database Password, and select the region closest to you.
4. Click **Create new project** and wait a few minutes for the database to provision.

---

## Step 2: Set Up Database Schema

Once your project is ready, you will set up the database tables and authentication triggers.

1. In the left sidebar of the Supabase dashboard, click on the **SQL Editor** icon (looks like `>_`).
2. Click **New query** (or **New Blank Query**).
3. Copy the entire SQL script below and paste it into the editor.
4. Click the **Run** button at the bottom right.

```sql
-- =====================================================================
-- 1. CLEANUP (Optional)
-- =====================================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.mood_logs;
drop table if exists public.health_logs;
drop table if exists public.medication_logs;
drop table if exists public.medicines;
drop table if exists public.profiles;

-- =====================================================================
-- 2. CREATE TABLES
-- =====================================================================

-- Profile Table (linked 1:1 with auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text not null,
  age integer,
  gender text,
  blood_group text,
  phone_number text,
  email_address text,
  address text,
  medical_conditions text,
  allergies text,
  emergency_contact_name text,
  emergency_contact_number text,
  is_dark_mode boolean default false
);

-- Medicines Table
create table public.medicines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  dosage text not null,
  type text not null,
  frequency text not null,
  reminder_time text not null,     -- format: "HH:mm" (24-hour style)
  period text not null,            -- Morning, Afternoon, Night
  recurring boolean default true,
  remaining_quantity integer default 30,
  total_adherence_count integer default 0,
  missed_count integer default 0,
  instructions text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Medication Logs Table (tracks taken/missed status)
create table public.medication_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  medicine_id uuid references public.medicines on delete cascade,
  medicine_name text not null,
  status text not null,            -- Taken, Missed, Pending
  timestamp bigint not null,       -- Unix Epoch timestamp in milliseconds
  date_string text not null,       -- format: "yyyy-MM-dd"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Health Logs Table (tracks daily vitals)
create table public.health_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  systolic_bp integer,
  diastolic_bp integer,
  heart_rate integer,
  blood_sugar numeric,
  weight numeric,
  sleep_hours numeric,
  water_intake_ml integer,
  steps integer,
  body_temp numeric,
  oxygen_saturation integer,
  timestamp bigint not null,       -- Unix Epoch timestamp in milliseconds
  date_string text not null,       -- format: "yyyy-MM-dd"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Mood Logs Table
create table public.mood_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  mood text not null,              -- Happy, Neutral, Tired, Stressed, etc.
  timestamp bigint not null,       -- Unix Epoch timestamp in milliseconds
  date_string text not null,       -- format: "yyyy-MM-dd"
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.medication_logs enable row level security;
alter table public.health_logs enable row level security;
alter table public.mood_logs enable row level security;

-- =====================================================================
-- 4. CREATE POLICIES (Users can only read/write their own data)
-- =====================================================================

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Medicines
create policy "Users can view own medicines" on public.medicines for select using (auth.uid() = user_id);
create policy "Users can insert own medicines" on public.medicines for insert with check (auth.uid() = user_id);
create policy "Users can update own medicines" on public.medicines for update using (auth.uid() = user_id);
create policy "Users can delete own medicines" on public.medicines for delete using (auth.uid() = user_id);

-- Medication Logs
create policy "Users can view own logs" on public.medication_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.medication_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own logs" on public.medication_logs for delete using (auth.uid() = user_id);

-- Health Logs
create policy "Users can view own health logs" on public.health_logs for select using (auth.uid() = user_id);
create policy "Users can insert own health logs" on public.health_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own health logs" on public.health_logs for delete using (auth.uid() = user_id);

-- Mood Logs
create policy "Users can view own mood logs" on public.mood_logs for select using (auth.uid() = user_id);
create policy "Users can insert own mood logs" on public.mood_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own mood logs" on public.mood_logs for delete using (auth.uid() = user_id);

-- =====================================================================
-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- =====================================================================

-- Create trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email_address,
    age,
    gender,
    blood_group,
    phone_number,
    address,
    medical_conditions,
    allergies,
    emergency_contact_name,
    emergency_contact_number,
    is_dark_mode
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Alexander Martinez'),
    new.email,
    coalesce((new.raw_user_meta_data->>'age')::integer, 42),
    coalesce(new.raw_user_meta_data->>'gender', 'Male'),
    coalesce(new.raw_user_meta_data->>'blood_group', 'A+'),
    coalesce(new.raw_user_meta_data->>'phone_number', '+1 (555) 382-9901'),
    coalesce(new.raw_user_meta_data->>'address', '782 Wellness Blvd, Seattle WA 98101'),
    coalesce(new.raw_user_meta_data->>'medical_conditions', 'Mild Hypertension, High Cholesterol'),
    coalesce(new.raw_user_meta_data->>'allergies', 'Sulfonamides, Peanuts'),
    coalesce(new.raw_user_meta_data->>'emergency_contact_name', 'Sophia Martinez (Spouse)'),
    coalesce(new.raw_user_meta_data->>'emergency_contact_number', '+1 (555) 382-9902'),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Step 3: Get API Keys & Configure App

To connect your React Native app with Supabase, you will need your API URL and Anonymous Key:

1. In the Supabase Dashboard, click on **Project Settings** (gear icon at the bottom of the left sidebar).
2. Click **API** in the settings sub-menu.
3. Under **API Settings**:
   - Locate the **Project URL**. Copy it.
   - Locate the **API Key** (the one labeled `anon` and `public`). Copy it.
4. Open the file [healthtrack-rn/.env](file:///c:/Users/AMohamed%20afzal/Downloads/healthtrack/healthtrack-rn/.env) (which we will create for you) and paste your keys:
   ```env
   SUPABASE_URL=YOUR_PROJECT_URL_HERE
   SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```

---

## Step 4: Run the App!

Once the plan is approved, we will set up the code directory and you'll be able to launch it:
1. Run `npm install` inside the `healthtrack-rn` folder.
2. Run `npm run start` or `npx expo start` to launch Expo Dev Tools, where you can scan the QR code using the Expo Go mobile app (iOS/Android) or test it in your browser.
