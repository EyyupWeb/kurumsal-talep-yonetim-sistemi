import dbConnect from "@/base/db";
import Ticket from "./ticket.model";

export async function getAllTickets() {
  await dbConnect();
  return Ticket.find({}).sort({ createdAt: -1 }).lean();
}

export async function createTicket(data) {
  await dbConnect();
  const ticket = await Ticket.create(data);
  return ticket.toObject();
}

export async function updateTicketStatus(id, durum) {
  await dbConnect();
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { durum },
    { new: true, runValidators: true }
  ).lean();
  return ticket;
}

export async function deleteTicket(id) {
  await dbConnect();
  const ticket = await Ticket.findByIdAndDelete(id).lean();
  return ticket;
}
