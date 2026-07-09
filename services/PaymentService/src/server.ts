import app from "./app";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {Payment} from "./payment-model";
import { connectRabbit } from "./rabbitmq";
import { connectMongo, connectMongoose } from "./database";

dotenv.config();

const PORT = process.env.PORT || 3004;
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

function buildMongoUrl(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  const hostname = process.env.MONGODB_HOSTNAME || "mongodb";
  const dbname = process.env.MONGODB_DBNAME || "paymentdb";
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  if (username && password) {
    return `mongodb://${username}:${password}@${hostname}:27017/${dbname}?authSource=admin`;
  }
  return `mongodb://${hostname}:27017/${dbname}`;
}

async function seed() {
  const count = await Payment.countDocuments();
  if (count > 0) {
    return;
  }
  await Payment.create([
    { amount: 250, currency: "DKK", payer: "alice@example.com", payee: "system", status: "completed" },
    { amount: 100, currency: "DKK", payer: "bob@example.com",   payee: "system", status: "pending" }
  ]);
  console.log("Seeded initial payments");
}

const mongoUrl = buildMongoUrl();

async function start() {
  await connectMongo(mongoUrl).catch((err: unknown) => {
    console.warn("MongoDB not connected:", err instanceof Error ? err.message : err);
  });

  await connectMongoose(mongoUrl).catch((err: unknown) => {
    console.warn("Mongoose not connected:", err instanceof Error ? err.message : err);
  });
  
  await connectRabbit(rabbitUrl).catch((err: unknown) => {
    console.warn("RabbitMQ not connected:", err instanceof Error ? err.message : err);
  });
  await seed().catch((seedErr: unknown) => {
      console.warn("Failed to seed initial payments:", seedErr instanceof Error ? seedErr.message : seedErr);
    });
  app.listen(PORT, () => {
      console.log(`PaymentService running on port ${PORT}`);
    });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
