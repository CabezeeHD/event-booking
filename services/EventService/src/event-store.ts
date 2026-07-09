import { Event } from "./event-model";
import { publishEvent } from "./rabbitmq";

export interface EventRecord {
  id: string;
  title: string;
  location: string;
  capacity: number;
  price: number;
}

function toRecord(doc: any): EventRecord {
  return {
    id: doc._id.toString(),
    title: doc.title,
    location: doc.location,
    capacity: doc.capacity,
    price: doc.price
  };
}


export async function listEvents(): Promise<EventRecord[]> {
  const docs = await Event.find().lean();
  return docs.map(toRecord); 
}

export async function getEventById(id: string): Promise<EventRecord | null> {
  const doc = await Event.findById(id).lean();
  return doc ? toRecord(doc) : null;
}

export async function reserveEventCapacity(id: string, seats: number): Promise<{success: boolean; remaining_capacity?: number} | null> {
  const doc = await Event.findOneAndUpdate(
    { _id: id, capacity: { $gte: seats } },
    { $inc: { capacity: -seats } },
    { new: true }).lean();
  if (!doc) {
    const existing = await Event.findById(id).lean();
    if (!existing) {
      return null; // Event not found
    }
    return { success: false, remaining_capacity: existing.capacity }; // Not enough capacity
  }
  await publishEvent("event.capacity_reserved", { id, seats_reserved: seats, remaining_capacity: doc.capacity });
  return { success: true, remaining_capacity: doc.capacity };
}

export async function releaseEventCapacity(id: string, seats: number): Promise<{success: boolean; remaining_capacity: number} | null> {
  const doc = await Event.findByIdAndUpdate(id, { $inc: { capacity: seats } }, { new: true }).lean();
  if (!doc) return null; // Event not found
  return { success: true, remaining_capacity: doc.capacity };
}

export async function createEvent(data: Omit<EventRecord, "id">): Promise<EventRecord> {
  const doc = await Event.create(data);
  await publishEvent("event.created", toRecord(doc));
  return toRecord(doc);
}

export async function updateEvent(id: string, data: Omit<EventRecord, "id">): Promise<EventRecord | null> {
  const doc = await Event.findByIdAndUpdate(id, data, { new: true }).lean();
  if (!doc) return null;
  await publishEvent("event.updated", toRecord(doc));
  return toRecord(doc);
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await Event.findByIdAndDelete(id);
  if (!result) return false;
  await publishEvent("event.deleted", { id });
  return true;
}
  