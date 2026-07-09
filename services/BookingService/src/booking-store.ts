import {Booking, BookingStatus, IBooking} from "./booking-model";
import { publishEvent } from "./rabbitmq";

export interface BookingRecord {
    id: string;
    userId: string;
    eventId: string;
    status: BookingStatus;
    createdAt: Date;
    quantity: number;
}

function toRecord(doc: any): BookingRecord {
    return {
        id: doc._id.toString(),
        userId: doc.userId,
        eventId: doc.eventId,
        status: doc.status,
        createdAt: doc.createdAt,
        quantity: doc.quantity
    };
}   


export async function listBookings() : Promise<BookingRecord[]> {
    const docs = await Booking.find().lean();
    return docs.map(toRecord); 
}

export async function getBookingById(id:string): Promise<BookingRecord | null> {
    const doc = await Booking.findById(id).lean();
    return doc ? toRecord(doc) : null;
}

export async function createBooking(data: Pick <BookingRecord, "userId" | "eventId" | "quantity">): Promise<BookingRecord> {
    const doc = await Booking.create({
        ...data,
        status: "pending" 
    });
    const record = toRecord(doc);
    await publishEvent("booking.created", record);
    return record;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<BookingRecord | null> {
    const doc = await Booking.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!doc) return null;
    const record = toRecord(doc);
    if (status === "confirmed") {
        await publishEvent("booking.confirmed", record);
    } else if (status === "cancelled") {
        await publishEvent("booking.cancelled", record);
    }
    return record;
}

export async function cancelBooking(id: string): Promise<BookingRecord | null> {
    const doc = await Booking.findByIdAndUpdate(id, { status: "cancelled" }, { new: true }).lean();
    return doc ? toRecord(doc) : null;
}



