import OpenAI from 'openai';
import { AITriageResult, CreateTicketInput, UrgencyLevel } from './types';

// MODEL CONFIGURATION:
// Default model is set to 'gpt-4o-mini'.
// Swap to 'gpt-4o' via OPENAI_MODEL env variable for maximum reasoning quality.
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Autonomous OpenAI Customer Support Agent.
 * Generates direct, step-by-step, comprehensive answers for EVERY customer inquiry,
 * while automatically categorizing, rating urgency, and creating internal summaries.
 */
export async function triageAndReplyTicket(ticket: CreateTicketInput): Promise<AITriageResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Resilient fallback for local demo mode before real OpenAI API key is added
  if (!apiKey || apiKey === 'your-openai-api-key' || apiKey.includes('your-')) {
    console.info('OPENAI_API_KEY is not set yet. Generating simulated AI triage result for local testing.');

    const combinedText = `${ticket.subject} ${ticket.message}`.toLowerCase();
    const isUrgent = /urgent|error|down|broken|crash|billing|refund|cannot access|blocked|security/i.test(combinedText);
    const isBilling = /billing|refund|charge|payment|invoice|credit card|price|subscription/i.test(combinedText);
    const isTech = /error|bug|issue|login|access|password|api|server|page|crash|integration/i.test(combinedText);

    const category = isBilling
      ? 'Billing & Subscriptions'
      : isTech
      ? 'Technical Support'
      : 'General Inquiry';
    const urgency: UrgencyLevel = isUrgent ? 'high' : isTech ? 'medium' : 'low';

    return {
      reply: `Hi ${ticket.name},\n\nThank you for reaching out regarding "${ticket.subject}".\n\nHere is an automated resolution summary to assist you right away:\n\n1. Issue Analysis: We have logged your request regarding ${ticket.subject}.\n2. Recommended Troubleshooting:\n   - Check your account settings or credentials if experiencing login/access issues.\n   - Ensure your payment details match your issuing bank for billing inquiries.\n3. Assignment: Your ticket has been categorized under "${category}" with "${urgency.toUpperCase()}" urgency and routed to an agent for priority review.\n\nIf you have additional details or screenshots to share, please reply directly to this thread!`,
      category,
      urgency,
      summary: `Automated AI Agent analyzed ticket from ${ticket.name} regarding "${ticket.subject}". Categorized as ${category} (${urgency} urgency).`,
    };
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are a world-class, autonomous AI Customer Support Agent & Technical Knowledge Specialist.
Your objective is to provide a direct, comprehensive, empathetic, and actionable solution for EVERY customer support ticket or question submitted.

Key Instructions for Customer Replies:
1. DIRECT RESOLUTION: Provide concrete, step-by-step troubleshooting or resolution steps addressing the user's specific concern directly (password reset, billing inquiry, software error, integration bug, sales question, etc.).
2. PROFESSIONAL TONE: Empathetic, polite, clear, and authoritative.
3. ACTIONABLE STEPS: Include numbered or bulleted troubleshooting steps, expected results, and next actions.
4. AUTOMATED TRIAGING:
   - Urgency Classification:
     * "high": Outages, payment/refund issues, security alerts, account lockouts, critical production errors.
     * "medium": Software bugs with workarounds, feature configuration issues, integration questions.
     * "low": General feedback, feature suggestions, pre-sales questions, documentation inquiries.

You MUST reply with ONLY a raw JSON object matching the following structure:
{
  "reply": "Comprehensive, polite, step-by-step customer-facing response addressing the specific subject and message directly.",
  "category": "Precise Category (e.g., 'Technical Support', 'Billing & Subscriptions', 'Account & Security', 'Feature Request', 'Bug Report', 'General Inquiry')",
  "urgency": "low" | "medium" | "high",
  "summary": "1-2 sentence concise internal triage summary for human support managers."
}`;

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
    throw new Error('Empty response received from OpenAI API.');
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
    reply: parsed.reply || `Hello ${ticket.name}, thank you for contacting support regarding "${ticket.subject}". We have received your ticket and our team is actively reviewing your request.`,
    category: parsed.category || 'General Inquiry',
    urgency,
    summary: parsed.summary || `Customer ${ticket.name} submitted ticket: ${ticket.subject}`,
  };
}
