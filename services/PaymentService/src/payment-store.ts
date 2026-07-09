import { Payment } from "./payment-model";
import { publishEvent } from "./rabbitmq";

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  payer: string;
  payee: string;
  status: "pending" | "completed" | "failed";
  transactionId?: string;
  createdAt: Date;
  bookingId?: string;
}

function toRecord(doc: any): PaymentRecord {
  return {
    id: doc._id.toString(),
    amount: doc.amount,
    currency: doc.currency,
    payer: doc.payer,
    payee: doc.payee,
    status: doc.status,
    transactionId: doc.transactionId,
    createdAt: doc.createdAt,
    bookingId: doc.bookingId
  };
}


export async function listPayments(): Promise<PaymentRecord[]> {
  const docs = await Payment.find().lean();
  return docs.map(toRecord);
}

export async function getPaymentById(id: string): Promise<PaymentRecord | null> {
  const doc = await Payment.findById(id).lean();
  return doc ? toRecord(doc) : null;
}

export async function createPayment(data: Omit<PaymentRecord, "id" | "createdAt">): Promise<PaymentRecord> {
  const doc = await Payment.create(data);
  const record = toRecord(doc);
  await publishEvent("payment.created", record);
  if (record.status === "completed") {
    await publishEvent("payment.completed", record);
  }
  return record;
}

export async function publishPaymentCreatedEvent(payment: PaymentRecord) {
  await publishEvent("payment.completed", payment);
}