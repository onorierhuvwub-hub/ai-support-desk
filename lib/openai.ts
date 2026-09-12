import OpenAI from 'openai';
import { AITriageResult, CreateTicketInput, UrgencyLevel } from './types';

// MODEL CONFIGURATION:
// Default model is set to 'gpt-4o-mini'.
// Swap to 'gpt-4o' via OPENAI_MODEL env variable for maximum reasoning depth.
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Single OpenAI Chat Completions API call to automatically generate a direct, tailored,
 * accurate answer for ANY customer question asked (e.g. marriage rules, technical support, billing, general knowledge).
 */
export async function triageAndReplyTicket(ticket: CreateTicketInput): Promise<AITriageResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Dynamic topic-aware fallback for local testing before real OpenAI API key is added
  if (!apiKey || apiKey === 'your-openai-api-key' || apiKey.includes('your-')) {
    console.info('OPENAI_API_KEY is not set yet. Generating dynamic simulated AI response for local testing.');

    const combinedText = `${ticket.subject} ${ticket.message}`.toLowerCase();

    let category = 'General Inquiry';
    let urgency: UrgencyLevel = 'low';
    let reply = '';

    if (combinedText.includes('marriage') || combinedText.includes('relationship') || combinedText.includes('wedding')) {
      category = 'General Knowledge & Legal Inquiry';
      urgency = 'low';
      reply = `Hello ${ticket.name},\n\nThank you for asking about "${ticket.subject}".\n\nHere are the key foundational principles and fundamental rules regarding marriage:\n\n1. Mutual Consent & Legal Capacity: Both individuals must freely consent to the marriage and meet the legal age requirements.\n2. Love, Respect & Mutual Support: Marriage is built on emotional partnership, open communication, trust, and mutual commitment.\n3. Legal Registration: Obtaining a marriage license and filing marriage certificates with legal authorities.\n4. Fidelity & Rights: Respecting marital commitments and understanding legal, financial, and property rights.\n5. Shared Responsibility: Working together on domestic, financial, and family obligations.\n\nIf you have any further questions, please feel free to reply directly to this ticket!`;
    } else if (combinedText.includes('billing') || combinedText.includes('refund') || combinedText.includes('charge') || combinedText.includes('invoice')) {
      category = 'Billing & Subscriptions';
      urgency = 'high';
      reply = `Hello ${ticket.name},\n\nThank you for reaching out regarding "${ticket.subject}".\n\nHere is the information regarding your billing inquiry:\n\n1. Invoice Verification: You can view and download past invoices under Account Settings -> Billing.\n2. Refund Eligibility: Charges within 30 days are eligible for standard refund review.\n3. Payment Update: Manage credit card details directly from the billing portal.\n\nOur team is reviewing your ticket for priority assistance!`;
    } else if (combinedText.includes('password') || combinedText.includes('login') || combinedText.includes('access') || combinedText.includes('account')) {
      category = 'Account & Security';
      urgency = 'high';
      reply = `Hello ${ticket.name},\n\nThank you for contacting support regarding "${ticket.subject}".\n\nTo resolve your account access request:\n\n1. Reset Password: Use the "Forgot Password" link on the login page to receive a reset link.\n2. Verification Code: Check your inbox or spam folder for the secure authorization code.\n3. Support Assistance: If locked out due to multiple attempts, wait 15 minutes before retrying.\n\nWe are standing by if you need further access help!`;
    } else {
      category = 'General Inquiry';
      urgency = 'low';
      reply = `Hello ${ticket.name},\n\nThank you for asking about "${ticket.subject}".\n\nRegarding your question:\n"${ticket.message}"\n\nHere is an immediate overview addressing your request:\n- Topic: ${ticket.subject}\n- Response: We have processed your inquiry and provided initial guidance.\n\nPlease reply if you need any additional details!`;
    }

    return {
      reply,
      category,
      urgency,
      summary: `Automated AI Agent analyzed ticket from ${ticket.name} regarding "${ticket.subject}". Categorized as ${category} (${urgency} urgency).`,
    };
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are a world-class, highly knowledgeable AI Support Specialist & Expert Assistant.
Your primary objective is to ANSWER THE CUSTOMER'S EXACT QUESTION DIRECTLY AND ACCURATELY.

CRITICAL GUIDELINES:
1. DIRECT ANSWER TO SPECIFIC QUESTION:
   - If the user asks a question about ANY topic (e.g. "What are the rules of marriage?", "How do I reset my password?", "What is your refund policy?", "How does photosynthesis work?", "What is an API?"), YOU MUST PROVIDE A DIRECT, ACCURATE, THOUGHTFUL, AND COMPREHENSIVE ANSWER SPECIFIC TO THAT EXACT QUESTION.
   - DO NOT output generic boilerplate troubleshooting steps (such as "check account settings" or "check billing") UNLESS the user specifically asked about account settings or billing.
2. TONE & FORMATTING:
   - Polite, empathetic, informative, and authoritative.
   - Use clear paragraphs, numbered lists, or bullet points to make the answer easy to read.
3. AUTOMATED TRIAGING:
   - category: Assign a precise category (e.g. 'General Knowledge', 'Technical Support', 'Billing & Subscriptions', 'Account & Security', 'Feature Request', 'Bug Report').
   - urgency: Assign 'low', 'medium', or 'high'.
   - summary: Provide a 1-2 sentence concise internal summary of the question and the answer given.

You MUST reply with ONLY a raw JSON object matching the following structure:
{
  "reply": "Direct, comprehensive, detailed answer addressing the customer's exact subject and message.",
  "category": "Precise Category Name",
  "urgency": "low" | "medium" | "high",
  "summary": "1-2 sentence concise internal triage summary."
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
