import Anthropic from '@anthropic-ai/sdk';
import { AITriageResult, CreateTicketInput, UrgencyLevel } from './types';

// MODEL CONFIGURATION:
// Note: Uses the model string 'claude-sonnet-5' as requested.
// Swap this string for whatever model your Anthropic account has access to if different
// (e.g. 'claude-3-5-sonnet-20241022' or 'claude-3-haiku-20240307').
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

/**
 * Single Claude API call to draft a customer-facing reply and perform automated triaging.
 * Returns structured JSON containing: reply, category, urgency (low/medium/high), and summary.
 */
export async function triageAndReplyTicket(ticket: CreateTicketInput): Promise<AITriageResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key') {
    throw new Error('ANTHROPIC_API_KEY environment variable is not configured or invalid.');
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are an expert customer support agent and AI triage specialist.
Your task is to analyze incoming support tickets, perform automated triaging, and generate a polite, professional, customer-facing response draft in a single call.

You MUST reply with ONLY a valid raw JSON object (no markdown codeblock wrapping, no extra prose) adhering strictly to this structure:

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

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1000,
    temperature: 0.2,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const contentBlock = response.content[0];
  if (!contentBlock || contentBlock.type !== 'text') {
    throw new Error('Unexpected response format from Claude AI API.');
  }

  const text = contentBlock.text.trim();
  // Strip markdown code block wrapper if present
  const cleanedText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON response: ${cleanedText}`);
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
