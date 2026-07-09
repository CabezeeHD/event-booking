import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import { connectRabbit, consumeQueue } from "./rabbitmq";
import { User } from "./user-model";
import { createUser } from "./user-store";
import { connectMongo, connectMongoose } from "./database";

dotenv.config();

const PORT = Number(process.env.PORT || 3001);
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

function buildMongoUrl(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const hostname = process.env.MONGODB_HOSTNAME || "mongodb";
  const dbname = process.env.MONGODB_DBNAME || "userdb";
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  if (username && password) {
    return `mongodb://${username}:${password}@${hostname}:27017/${dbname}?authSource=admin`;
  }

  return `mongodb://${hostname}:27017/${dbname}`;
}

const mongoUrl = buildMongoUrl();

async function seed() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log("Users already seeded.");
    return;
  }
  await User.create([
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
    { name: "Charlie", email: "charlie@example.com" }
  ]);
  console.log("Seeded initial users.");
}

async function start() {
  await connectMongo(mongoUrl).catch((err: unknown) => {
    console.warn("MongoDB not connected:", err instanceof Error ? err.message : err);
  });

  await connectMongoose(mongoUrl).catch((err: unknown) => {
    console.warn("Mongoose not connected:", err instanceof Error ? err.message : err);
  });

  await seed().catch((err: unknown) => {
    console.warn("Failed to seed initial users:", err instanceof Error ? err.message : err);
  });

  await connectRabbit(rabbitUrl).catch((err: unknown) => {
    console.warn("RabbitMQ not connected:", err instanceof Error ? err.message : err);
  });
  
  app.listen(PORT, () => {
    console.log(`UserService running on port ${PORT}`);
  });
}

    
start().catch((err) => {
  console.error(err);
  process.exit(1);
});