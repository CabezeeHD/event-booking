import mongoose from "mongoose";

export interface IPayment extends mongoose.Document {
    amount: number;
    currency: string;
    payer: string;
    payee: string;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    createdAt: Date;
    bookingId?: string;
}

const paymentSchema = new mongoose.Schema<IPayment>({
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'DKK' },
    payer: { type: String, required: true },
    payee: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionId: { type: String },
    createdAt: { type: Date, default: Date.now },
    bookingId: { type: String }
});

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);