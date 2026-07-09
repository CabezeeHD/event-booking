import { MongoClient, Db } from "mongodb";
import mongoose from "mongoose";

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectMongo(uri: string): Promise<Db> {
  if (database) {
    return database;
  }

  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  database = client.db(process.env.MONGODB_DBNAME || "paymentdb");
  console.log(`Connected to MongoDB at ${uri}`);
  return database;
}

export async function connectMongoose(uri: string): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    return;
  }
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB with Mongoose at ${uri}`);
} 

export function getDb(): Db {
  if (!database) {
    throw new Error("MongoDB is not connected yet");
  }
  return database;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
