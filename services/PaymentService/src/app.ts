import express, { Request, Response } from "express";
import { listPayments, getPaymentById, createPayment, publishPaymentCreatedEvent } from "./payment-store";

const app = express();

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ service: "PaymentService", status: "running" });
});

app.get("/payments", async (_req: Request, res: Response) => {
  try {
    const payments = await listPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to list payments" });
  }
});

app.get("/payments/:id", async (req: Request, res: Response) => {
  try {
    const payment = await getPaymentById(String(req.params.id));
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json(payment);
  }
  catch (error) {
    res.status(500).json({ error: "Failed to get payment" });
  }
});

app.post("/payments", async (req: Request, res: Response) => {
  try{
    const { amount, currency, payer, payee, bookingId } = req.body;

    if (!payer || !payee || !amount) {
      return res.status(400).json({ error: "payer, payee and amount are required" });
    }

    const payment = await createPayment({
      amount,
      currency: currency || "DKK",
      payer,
      payee,
      status: "completed",
      bookingId
    });

    publishPaymentCreatedEvent(payment);

    res.status(201).json(payment);
  }
  catch (error) {
    res.status(500).json({ error: "Failed to create payment" });
  }
});

export default app;
