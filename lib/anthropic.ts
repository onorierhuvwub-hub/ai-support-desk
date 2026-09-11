import Anthropic from '@anthropic-ai/sdk';
import { AITriageResult, CreateTicketInput, UrgencyLevel } from './types';

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

/**
 * Creates a customer-facing reply and ticket triage in one Claude API request.
 */
export async function triageAndReplyTicket(ticket: CreateTicketInput): Promise<AITriageResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key') {
    throw new Error('ANTHROPIC_API_KEY environment variable is not configured.');
  }

  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = `You are an expert customer support agent and AI triage specialist.
Return ONLY a valid JSON object with this exact shape:
{
  "reply": "A polite, helpful, empathetic customer-facing response that directly addresses the question.",
  "category": "A short category name",
  "urgency": "low", "summary": "A concise internal summary"
}
Set urgency to high only for outages, security, data loss, urgent billing, or production-blocking issues; use medium for standard bugs and account help; otherwise use low.`;
  const userPrompt = `Customer Name: ${ticket.name}
Customer Email: ${ticket.email}
Subject: ${ticket.subject}

Message:
${ticket.message}`;

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const contentBlock = response.content.find((block) => block.type === 'text');
  if (!contentBlock || contentBlock.type !== 'text') {
    throw new Error('Claude returned no text response.');
  }

  const cleanedText = contentBlock.text
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, '')
    .replace(/\s*\`\`\`$/, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    throw new Error('Claude returned malformed JSON.');
  }

  const urgency: UrgencyLevel = ['low', 'medium', 'high'].includes(String(parsed.urgency).toLowerCase())
    ? String(parsed.urgency).toLowerCase() as UrgencyLevel
    : 'medium';

  if (typeof parsed.reply !== 'string' || !parsed.reply.trim()) {
    throw new Error('Claude response did not include a reply.');
  }

  return {
    reply: parsed.reply.trim(),
    category: typeof parsed.category === 'string' && parsed.category.trim() ? parsed.category.trim() : 'General Inquiry',
    urgency,
    summary: typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : `Customer ${ticket.name} submitted ticket: ${ticket.subject}`,
  };
}
