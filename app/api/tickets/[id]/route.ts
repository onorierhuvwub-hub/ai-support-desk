import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required.' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'ai_responded', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status ("pending", "ai_responded", or "resolved") is required.' },
        { status: 400 }
      );
    }

    const { data: ticket, error } = await db
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)
      .select()
      .single();

    if (error || !ticket) {
      console.error('Error updating ticket status in Supabase:', error);
      return NextResponse.json({ error: 'Failed to update ticket status.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    console.error('Unexpected error in PATCH /api/tickets/[id]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
