import dotenv from "dotenv";
import app from "./app";
import { connectMongo, connectMongoose } from "./database";
import { connectRabbit } from "./rabbitmq";
import { createGrpcServer } from "./grpc";
import * as grpc from "@grpc/grpc-js";
import { Event } from "./event-model";
import mongoose from "mongoose";

dotenv.config();

const httpPort = Number(process.env.PORT || 3002);
const grpcPort = Number(process.env.GRPC_PORT || 50051);
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

function buildMongoUrl(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const hostname = process.env.MONGODB_HOSTNAME || "mongodb";
  const dbname = process.env.MONGODB_DBNAME || "eventdb";
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  if (username && password) {
    return `mongodb://${username}:${password}@${hostname}:27017/${dbname}?authSource=admin`;
  }

  return `mongodb://${hostname}:27017/${dbname}`;
}

async function seed() {
  const count = await Event.countDocuments();
  if (count > 0) return;
  await Event.create([
    { _id: new mongoose.Types.ObjectId("0c94ff607603440960f50000"), title: "Tech Talk Aarhus", location: "Aarhus", capacity: 100, price: 50 },
    { _id: new mongoose.Types.ObjectId("2e820eb43e634606920050d0"), title: "Music Night", location: "Copenhagen", capacity: 250, price: 75 },
  ]);
  console.log("Seeded initial events.");
}

const mongoUrl = buildMongoUrl();

async function start() {
  await connectMongo(mongoUrl).catch((err: unknown) => {
    console.warn("MongoDB not connected:", err instanceof Error ? err.message : err);
  });

  await connectMongoose(mongoUrl).catch((err: unknown) => {
    console.warn("Mongoose not connected:", err instanceof Error ? err.message : err);
  });

  await seed().catch((err: unknown) => {
  console.warn("Failed to seed initial events:", err instanceof Error ? err.message : err);
});

  await connectRabbit(rabbitUrl).catch((err: unknown) => {
    console.warn("RabbitMQ not connected:", err instanceof Error ? err.message : err);
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
      console.log(`gRPC EventService listening on ${port}`);
    }
  );

  app.listen(httpPort, () => {
    console.log(`EventService HTTP listening on ${httpPort}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});