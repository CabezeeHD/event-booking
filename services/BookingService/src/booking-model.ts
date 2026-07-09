import mongoose from "mongoose";


export type BookingStatus = "pending" | "confirmed" | "cancelled" | "failed";

export interface IBooking extends mongoose.Document {
    userId: string;
    eventId: string;
    status: BookingStatus;
    createdAt: Date;
    updatedAt: Date;
    quantity: number;
}


const bookingSchema = new mongoose.Schema<IBooking>({
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { 
        type: String, 
        enum: ["pending", "confirmed", "cancelled", "failed"], 
        default: "pending" }
    }, 
    { timestamps: true });


export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);