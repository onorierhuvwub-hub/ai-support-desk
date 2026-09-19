import OpenAI from 'openai';
import { AITriageResult, CreateTicketInput } from './types';

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const acknowledgement =
  "Hello, thank you for contacting Brownny Support regarding your request. We have logged your request. Our support team is prioritizing your inquiry under category 'General Inquiry' with urgency level 'high'. A support representative will follow up if further action is required.";

function looksLikeQuestion(ticket: CreateTicketInput) {
  const text = (ticket.subject + ' ' + ticket.message).trim();
  return /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|would|should|will|explain|define|tell me|meaning of)\b/i.test(text) || text.includes('?');
}

function fallback(ticket: CreateTicketInput): AITriageResult {
  if (looksLikeQuestion(ticket)) {
    return {
      reply: 'I am unable to generate an AI answer right now. Please try again shortly while Brownny restores the AI answer service.',
      category: 'General Question',
      urgency: 'medium',
      summary: 'A factual question was received and is awaiting the AI answer service.',
    };
  }

  return {
    reply: acknowledgement,
    category: 'General Inquiry',
    urgency: 'high',
    summary: 'Brownny Support logged ' + ticket.name + "'s request as a high-priority General Inquiry.",
  };
}

export async function triageAndReplyTicket(ticket: CreateTicketInput): Promise<AITriageResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-api-key' || apiKey.includes('your-')) {
    return fallback(ticket);
  }

  const systemPrompt = [
    'You are the Brownny Support routing and answer assistant. Return ONLY a JSON object with kind, reply, and summary fields.',
    '',
    'First decide the request kind:',
    '- question: the customer primarily seeks knowledge, a definition, an explanation, an evaluation, or a factual answer.',
    '- enquiry: the customer primarily asks Brownny to take action, investigate, follow up, provide service, resolve a problem, or handle an account, order, or status issue.',
    '- If it is ambiguous, choose question only when its primary goal is an explanation; otherwise choose enquiry.',
    '',
    'For a question: answer accurately, directly, and professionally. Give the meaning or answer first, followed by concise context and a practical evaluation, example, benefit, limitation, or next step when useful. Never invent facts. Do not use the Brownny acknowledgement paragraph.',
    '',
    'For an enquiry: set reply to this exact text and do not add any other content:',
    acknowledgement,
    '',
    'For summary, briefly summarize the request and result.',
  ].join('\n');

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Customer name: ' + ticket.name + '\nSubject: ' + ticket.subject + '\nMessage: ' + ticket.message,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    const parsed = content ? JSON.parse(content) : {};
    const kind =
      parsed.kind === 'question' || parsed.kind === 'enquiry'
        ? parsed.kind
        : looksLikeQuestion(ticket)
          ? 'question'
          : 'enquiry';

    if (kind === 'enquiry') {
      return {
        reply: acknowledgement,
        category: 'General Inquiry',
        urgency: 'high',
        summary:
          typeof parsed.summary === 'string'
            ? parsed.summary
            : 'Brownny Support logged ' + ticket.name + "'s request as a high-priority General Inquiry.",
      };
    }

    return {
      reply:
        typeof parsed.reply === 'string' && parsed.reply.trim()
          ? parsed.reply.trim()
          : fallback(ticket).reply,
      category: 'General Question',
      urgency: 'medium',
      summary:
        typeof parsed.summary === 'string'
          ? parsed.summary
          : 'Brownny AI provided an answer to a general question.',
    };
  } catch (error) {
    console.warn('Brownny Support AI response failed.', error);
    return fallback(ticket);
  }
}
