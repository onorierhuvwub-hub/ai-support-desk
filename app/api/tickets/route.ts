import { NextResponse } from 'next/server';
import { saveTicketToDb, updateTicketInDb, getTicketsFromDb } from '@/lib/supabase';
import { triageAndReplyTicket } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body || {};

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields (name, email, subject, message) are required.' },
        { status: 400 }
      );
    }

    // STEP 1: Immediately save ticket in DB (Supabase or Resilient Local Store)
    const initialTicket = await saveTicketToDb({ name, email, subject, message });

    // STEP 2: Attempt OpenAI GPT Triage & Draft Reply
    try {
      const aiResult = await triageAndReplyTicket({ name, email, subject, message });

      // STEP 3: Update ticket with AI reply, category, urgency, summary, and 'ai_responded' status
      const updatedTicket = await updateTicketInDb(initialTicket.id, {
        status: 'ai_responded',
        ai_reply: aiResult.reply,
        category: aiResult.category,
        urgency: aiResult.urgency,
        summary: aiResult.summary,
      });

      return NextResponse.json({
        success: true,
        ticket: updatedTicket || {
          ...initialTicket,
          status: 'ai_responded',
          ai_reply: aiResult.reply,
          category: aiResult.category,
          urgency: aiResult.urgency,
          summary: aiResult.summary,
        },
        aiStatus: 'success',
      });
    } catch (aiError: any) {
      console.warn('AI Triage failed, ticket preserved in pending status:', aiError?.message || aiError);

      // RESILIENCE FALLBACK: Ticket remains safely saved in pending state
      return NextResponse.json({
        success: true,
        ticket: initialTicket,
        aiStatus: 'fallback',
        message: 'Your ticket has been saved! Our support team will review your request and follow up shortly.',
      });
    }
  } catch (err: any) {
    console.error('Unexpected error in POST /api/tickets:', err);
    return NextResponse.json(
      { error: 'Internal server error while processing request.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const tickets = await getTicketsFromDb(statusFilter);

    return NextResponse.json({ success: true, tickets });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/tickets:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
