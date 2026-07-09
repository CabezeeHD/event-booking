import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import { connectRabbit, consumeQueue } from "./rabbitmq";
import { createNotification } from "./notification-store";
import { Notification } from "./notification-model";
import { connectMongo, connectMongoose } from "./database";

dotenv.config();

const PORT = Number(process.env.PORT || 3005);
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

function buildMongoUrl(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const hostname = process.env.MONGODB_HOSTNAME || "mongodb";
  const dbname = process.env.MONGODB_DBNAME || "notificationdb";
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  if (username && password) {
    return `mongodb://${username}:${password}@${hostname}:27017/${dbname}?authSource=admin`;
  }

  return `mongodb://${hostname}:27017/${dbname}`;
}

const mongoUrl = buildMongoUrl();

async function seed() {
  const count = await Notification.countDocuments();
  if (count > 0) return;
  await Notification.create([
    { title: "Welcome", message: "Welcome to the platform!", recipient: "alice@example.com", read: false, createdAt: new Date() },
    { title: "Booking Confirmed", message: "Your booking has been confirmed.", recipient: "bob@example.com", read: true, createdAt: new Date() }
  ]);
  console.log("Seeded initial notifications.");
}

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

  await seed().catch((err: unknown) => {
    console.warn("Failed to seed initial notifications:", err instanceof Error ? err.message : err);
  });

  await consumeQueue("notifications", ["booking.confirmed"], async (payload) => {
    await createNotification({
      title: "Booking Confirmed",
      message: `Your booking for event ${payload.eventId} has been confirmed.`,
      recipient: payload.userId,
      read: false,
      createdAt: new Date()
    });
    console.log(`Notification created for user ${payload.userId}`);
  }).catch((err: unknown) => {
    console.warn("Failed to consume RabbitMQ queue:", err instanceof Error ? err.message : err);
  });

  app.listen(PORT, () => {
    console.log(`NotificationService running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});