export type TicketStatus = 'pending' | 'ai_responded' | 'resolved';
export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface Ticket {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  ai_reply: string | null;
  category: string | null;
  urgency: UrgencyLevel | null;
  summary: string | null;
}

export interface CreateTicketInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface AITriageResult {
  reply: string;
  category: string;
  urgency: UrgencyLevel;
  summary: string;
}
