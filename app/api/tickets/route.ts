import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { triageAndReplyTicket } from '@/lib/anthropic';

// Choose admin client if service key exists, fallback to standard client
const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

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

    // STEP 1: Immediately save the ticket as 'pending' in database for resilience
    const { data: initialTicket, error: insertError } = await db
      .from('tickets')
      .insert({
        name,
        email,
        subject,
        message,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !initialTicket) {
      console.error('Failed to save ticket to Supabase:', insertError);
      return NextResponse.json(
        { error: 'Failed to create support ticket in database. Please try again.' },
        { status: 500 }
      );
    }

    // STEP 2: Attempt Claude AI Triage & Draft Reply
    try {
      const aiResult = await triageAndReplyTicket({ name, email, subject, message });

      // STEP 3: Update ticket with AI reply, category, urgency, summary, and 'ai_responded' status
      const { data: updatedTicket, error: updateError } = await db
        .from('tickets')
        .update({
          status: 'ai_responded',
          ai_reply: aiResult.reply,
          category: aiResult.category,
          urgency: aiResult.urgency,
          summary: aiResult.summary,
        })
        .eq('id', initialTicket.id)
        .select()
        .single();

      if (updateError || !updatedTicket) {
        console.error('Failed to update ticket with AI response:', updateError);
        // Even if update failed, return initial saved ticket
        return NextResponse.json({
          success: true,
          ticket: initialTicket,
          aiStatus: 'fallback',
          message: 'Ticket saved! AI reply update failed, support team will follow up.',
        });
      }

      return NextResponse.json({
        success: true,
        ticket: updatedTicket,
        aiStatus: 'success',
      });
    } catch (aiError: any) {
      console.warn('AI Triage failed, ticket preserved as pending:', aiError?.message || aiError);
      
      // RESILIENCE FALLBACK: Ticket remains safely saved in Supabase as 'pending'
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

    let query = db.from('tickets').select('*').order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error('Error fetching tickets from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch tickets.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tickets: tickets || [] });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/tickets:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
