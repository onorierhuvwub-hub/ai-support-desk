import { createClient } from '@supabase/supabase-js';
import { Ticket } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Helper to check if valid Supabase credentials have been set up
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-project') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-supabase-anon-key')
);

// Standard Supabase clients
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Persistent Global Store across Next.js dev server reloads
declare global {
  var __mockTicketsStore: Ticket[] | undefined;
}

const mockTicketsStore: Ticket[] = globalThis.__mockTicketsStore || [];
if (!globalThis.__mockTicketsStore) {
  globalThis.__mockTicketsStore = mockTicketsStore;
}

/**
 * Resilient Ticket Creation:
 * Uses Supabase when configured, or local store fallback if Supabase credentials are missing/invalid.
 */
export async function saveTicketToDb(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<Ticket> {
  if (isSupabaseConfigured) {
    try {
      const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;
      const { data: inserted, error } = await db
        .from('tickets')
        .insert({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && inserted) {
        return inserted as Ticket;
      }
      console.warn('Supabase DB insert warning, utilizing fallback store:', error?.message);
    } catch (err: any) {
      console.warn('Supabase connection warning, utilizing fallback store:', err?.message);
    }
  }

  // Resilient Local Fallback Store
  const newTicket: Ticket = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    status: 'pending',
    ai_reply: null,
    category: null,
    urgency: null,
    summary: null,
  };

  mockTicketsStore.unshift(newTicket);
  return newTicket;
}

/**
 * Resilient Ticket Update:
 * Updates Supabase DB or local store.
 */
export async function updateTicketInDb(
  id: string,
  updates: Partial<Ticket>
): Promise<Ticket | null> {
  if (isSupabaseConfigured) {
    try {
      const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;
      const { data: updated, error } = await db
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && updated) {
        return updated as Ticket;
      }
    } catch (err: any) {
      console.warn('Supabase DB update warning, updating fallback store:', err?.message);
    }
  }

  // Update in global store
  const ticket = mockTicketsStore.find((t) => t.id === id);
  if (ticket) {
    Object.assign(ticket, updates, { updated_at: new Date().toISOString() });
    return ticket;
  }
  return null;
}

/**
 * Resilient Ticket Retrieval:
 * Fetches from Supabase DB or local store.
 */
export async function getTicketsFromDb(statusFilter?: string | null): Promise<Ticket[]> {
  if (isSupabaseConfigured) {
    try {
      const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;
      let query = db.from('tickets').select('*').order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: fetched, error } = await query;
      if (!error && fetched) {
        return fetched as Ticket[];
      }
    } catch (err: any) {
      console.warn('Supabase DB fetch warning, returning fallback store:', err?.message);
    }
  }

  // Filter global store
  if (statusFilter && statusFilter !== 'all') {
    return mockTicketsStore.filter((t) => t.status === statusFilter);
  }
  return mockTicketsStore;
}
