import OpenAI from 'openai';
import { AITriageResult, CreateTicketInput, UrgencyLevel } from './types';

// MODEL CONFIGURATION:
// Default model is set to 'gpt-4o-mini'.
// Swap to 'gpt-4o' if you want higher-quality replies over cost,
// or configure via the OPENAI_MODEL environment variable.
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Single OpenAI Chat Completions API call to draft a customer-facing reply and perform automated triaging.
 * Uses response_format: { type: "json_object" } for structured JSON output.
 * If OPENAI_API_KEY is not configured yet, provides intelligent simulated triage so local testing succeeds out-of-the-box.
 */
export async function triageAndReplyTicket(ticket: CreateTicketInput): Promise<AITriageResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Fallback for local demo mode before real OpenAI API key is added
  if (!apiKey || apiKey === 'your-openai-api-key' || apiKey.includes('your-')) {
    console.info('OPENAI_API_KEY is not set yet. Generating simulated AI triage result for local testing.');

    const combinedText = `${ticket.subject} ${ticket.message}`.toLowerCase();
    const isUrgent = /urgent|error|down|broken|crash|billing|refund|cannot access|blocked/i.test(combinedText);
    const isBilling = /billing|refund|charge|payment|invoice|credit card|price/i.test(combinedText);
    const isTech = /error|bug|issue|login|access|password|api|server|page|crash/i.test(combinedText);

    const category = isBilling ? 'Billing & Subscriptions' : isTech ? 'Technical Support' : 'General Inquiry';
    const urgency: UrgencyLevel = isUrgent ? 'high' : isTech ? 'medium' : 'low';

    return {
      reply: `Hi ${ticket.name},\n\nThank you for reaching out to support regarding "${ticket.subject}".\n\nWe have received your request and our automated system has prioritized your ticket. An agent will review your inquiry shortly.\n\nSummary of your request:\n- Issue: ${ticket.subject}\n- Category: ${category}\n\nIf you have any further context, please reply directly to this thread!`,
      category,
      urgency,
      summary: `Customer ${ticket.name} requested assistance regarding: ${ticket.subject}. Classified as ${category} (${urgency} urgency).`,
    };
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are an expert customer support agent and AI triage specialist.
Your task is to analyze incoming support tickets, perform automated triaging, and generate a polite, professional, customer-facing response draft in a single call.

You MUST reply with a valid JSON object matching the following structure:
{
  "reply": "Polite, helpful, empathetic customer-facing response addressing the user's specific concern directly.",
  "category": "Category name (e.g., 'Technical Support', 'Billing', 'Account Access', 'Feature Request', 'Bug Report', 'General Inquiry')",
  "urgency": "low" | "medium" | "high",
  "summary": "1-2 sentence concise internal summary of the ticket for support representatives."
}

Urgency Classification Rules:
- "high": Critical system outage, security vulnerability, urgent billing/payment issue, data loss, or blocking production bug.
- "medium": Standard bug report, feature malfunction with workaround, account settings help.
- "low": General question, non-urgent feedback, cosmetic UI suggestion, feature request.`;

  const userPrompt = `Customer Name: ${ticket.name}
Customer Email: ${ticket.email}
Subject: ${ticket.subject}

Message:
${ticket.message}`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const messageContent = response.choices[0]?.message?.content;
  if (!messageContent) {
    throw new Error('Empty response received from OpenAI Chat Completions API.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(messageContent);
  } catch (err) {
    throw new Error(`Failed to parse OpenAI JSON response: ${messageContent}`);
  }

  let urgency: UrgencyLevel = 'medium';
  if (['low', 'medium', 'high'].includes(String(parsed.urgency).toLowerCase())) {
    urgency = String(parsed.urgency).toLowerCase() as UrgencyLevel;
  }

  return {
    reply: parsed.reply || 'Thank you for contacting support. We have received your ticket and our team will follow up shortly.',
    category: parsed.category || 'General Inquiry',
    urgency,
    summary: parsed.summary || `Customer ${ticket.name} submitted ticket: ${ticket.subject}`,
  };
}
