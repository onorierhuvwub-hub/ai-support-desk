import OpenAI from 'openai';
import { AITriageResult, CreateTicketInput } from './types';

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const acknowledgement = (ticket: CreateTicketInput) =>
  `Hello, thank you for contacting Brownny Support regarding your request. We have logged your request. Our support team is prioritizing your inquiry under category 'General Inquiry' with urgency level 'high'. A support representative will follow up if further action is required.`;

const fallback = (ticket: CreateTicketInput): AITriageResult => ({
  reply: `${acknowledgement(ticket)}\n\nWe are unable to generate the detailed answer at this moment, but your request has been recorded for follow-up.`,
  category: 'General Inquiry',
  urgency: 'high',
  summary: `Brownny Support logged ${ticket.name}'s request as a high-priority General Inquiry.`,
});

export async function triageAndReplyTicket(ticket: CreateTicketInput): Promise<AITriageResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-api-key' || apiKey.includes('your-')) {
    return fallback(ticket);
  }

  const systemPrompt = `You are Brownny Support. Return ONLY a JSON object with reply and summary fields.

Your reply MUST begin exactly with this paragraph:
"Hello, thank you for contacting Brownny Support regarding your request. We have logged your request. Our support team is prioritizing your inquiry under category 'General Inquiry' with urgency level 'high'. A support representative will follow up if further action is required."

Then answer the customer's question accurately and clearly. For questions asking what something means, how something works, or asking for information, give:
1. A direct definition or answer.
2. A brief explanation of the meaning and context.
3. A practical evaluation, examples, benefits, limitations, or next steps when useful.
Never invent facts. If information is uncertain or needs account-specific investigation, clearly say what a Brownny representative will verify.
Keep the tone helpful, professional, and concise.`;

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Customer name: ${ticket.name}\nSubject: ${ticket.subject}\nMessage: ${ticket.message}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    const parsed = content ? JSON.parse(content) : {};

    return {
      reply: parsed.reply || fallback(ticket).reply,
      category: 'General Inquiry',
      urgency: 'high',
      summary: parsed.summary || `Brownny Support logged ${ticket.name}'s request as a high-priority General Inquiry.`,
    };
  } catch (error) {
    console.warn('Brownny Support AI response failed; returning the standard acknowledgement.', error);
    return fallback(ticket);
  }
}
