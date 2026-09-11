-- AI Support Desk Database Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

-- 1. Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ai_responded', 'resolved')),
    ai_reply TEXT,
    category TEXT,
    urgency TEXT CHECK (urgency IS NULL OR urgency IN ('low', 'medium', 'high')),
    summary TEXT
);

-- 2. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to tickets table
DROP TRIGGER IF EXISTS set_tickets_updated_at ON public.tickets;
CREATE TRIGGER set_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- Allow anyone to insert tickets (Support Form submit)
CREATE POLICY "Allow public insert access to tickets" 
    ON public.tickets 
    FOR INSERT 
    WITH CHECK (true);

-- Allow public read access to tickets (for Agent Dashboard and inline status updates)
CREATE POLICY "Allow public select access to tickets" 
    ON public.tickets 
    FOR SELECT 
    USING (true);

-- Allow public update access to tickets (for marking resolved and setting AI reply)
CREATE POLICY "Allow public update access to tickets" 
    ON public.tickets 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON public.tickets(urgency);
