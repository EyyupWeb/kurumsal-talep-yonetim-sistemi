import { NextResponse } from "next/server";
import {
  updateTicketStatus,
  deleteTicket,
} from "@/features/tickets/ticket.service";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { durum } = await request.json();
    const ticket = await updateTicketStatus(id, durum);

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket bulunamadi." },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const ticket = await deleteTicket(id);

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket bulunamadi." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
