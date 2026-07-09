import dotenv from "dotenv";
import app from "./app";
import { connectMongo, connectMongoose } from "./database";
import { connectRabbit } from "./rabbitmq";
import { createGrpcServer } from "./grpc";
import * as grpc from "@grpc/grpc-js";
import { Booking } from "./booking-model";
import { consumeQueue } from "./rabbitmq";
import {updateBookingStatus} from "./booking-store";

dotenv.config();

const httpPort = Number(process.env.PORT || 3003);
const grpcPort = Number(process.env.GRPC_PORT || 50051);
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

function buildMongoUrl(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const hostname = process.env.MONGODB_HOSTNAME || "mongodb";
  const dbname = process.env.MONGODB_DBNAME || "bookingdb";
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  if (username && password) {
    return `mongodb://${username}:${password}@${hostname}:27017/${dbname}?authSource=admin`;
  }

  return `mongodb://${hostname}:27017/${dbname}`;
}

const mongoUrl = buildMongoUrl();

async function seed() {
  const count = await Booking.countDocuments();
  if (count > 0) {
    return;
  }
await Booking.create([
  { userId: "alice@example.com",   eventId: "0c94ff607603440960f50000", quantity: 2, status: "confirmed" },
  { userId: "bob@example.com",     eventId: "0c94ff607603440960f50000", quantity: 1, status: "pending"   },
  { userId: "charlie@example.com", eventId: "2e820eb43e634606920050d0", quantity: 3, status: "cancelled" },
  ]);
  console.log("Seeded initial bookings");
}

async function start() {
  await connectMongo(mongoUrl).catch((err: unknown) => {
    console.warn("MongoDB not connected:", err instanceof Error ? err.message : err);
  });

  await connectMongoose(mongoUrl).catch((err: unknown) => {
    console.warn("Mongoose not connected:", err instanceof Error ? err.message : err);
  });

  await seed().catch((err: unknown) => {
    console.warn("Failed to seed initial bookings:", err instanceof Error ? err.message : err);
  });

  await connectRabbit(rabbitUrl).catch((err: unknown) => {
    console.warn("RabbitMQ not connected:", err instanceof Error ? err.message : err);
  }); 

 await consumeQueue("booking_payment_events", ["payment.completed", "payment.failed"], async (payload) => {
  if (!payload.bookingId) return;
  if (payload.status === "completed") {
    await updateBookingStatus(payload.bookingId, "confirmed");
    console.log(`Booking ${payload.bookingId} confirmed via payment`);
  } else if (payload.status === "failed") {
    await updateBookingStatus(payload.bookingId, "cancelled");
    console.log(`Booking ${payload.bookingId} cancelled due to failed payment`);
  }
  }).catch((err: unknown) => {
    console.warn("Failed to consume RabbitMQ queue:", err instanceof Error ? err.message : err);
  });

  const grpcServer = createGrpcServer();
  grpcServer.bindAsync(
      `0.0.0.0:${grpcPort}`,
      grpc.ServerCredentials.createInsecure(),
      (error: Error | null, port: number) => {
        if (error) {
          console.error("Failed to bind gRPC server:", error);
          return;
        }
        grpcServer.start();
        console.log(`gRPC BookingService listening on ${port}`);
      }
  );

  app.listen(httpPort, () => {
    console.log(`BookingService HTTP listening on ${httpPort}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});