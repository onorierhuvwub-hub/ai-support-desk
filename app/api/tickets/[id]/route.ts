import { NextResponse } from 'next/server';
import { updateTicketInDb } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const updatedTicket = await updateTicketInDb(ticketId, { status });

    if (!updatedTicket) {
      return NextResponse.json({ error: 'Failed to update ticket status.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (err: any) {
    console.error('Unexpected error in PATCH /api/tickets/[id]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
