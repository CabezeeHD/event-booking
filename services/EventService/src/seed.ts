import dotenv from "dotenv";
import mongoose from "mongoose";
import { Event } from "./event-model";

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/eventdb";

const seedData = [
  { id: 1, title: "Tech Talk Aarhus", location: "Aarhus", capacity: 100 },
  { id: 2, title: "Music Night", location: "Copenhagen", capacity: 250 }
];

async function seedDatabase() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB for seeding");

        await Event.deleteMany({});
        console.log("Cleared existing events");

        await Event.insertMany(seedData);
        console.log("Seeded database with initial events"); 

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB after seeding");
    }
    catch (error) {
        console.error("Error seeding database:", error);
    }
}

seedDatabase().catch(error => {
    console.error("Error in seedDatabase:", error);
    process.exit(1);
});