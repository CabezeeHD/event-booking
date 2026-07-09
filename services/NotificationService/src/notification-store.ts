import { Notification } from "./notification-model";
import { publishEvent } from "./rabbitmq";

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  recipient: string;
  read: boolean;
  createdAt: Date;
}

function toRecord(doc: any): NotificationRecord {
  return {
    id: doc._id.toString(),
    title: doc.title,
    message: doc.message,
    recipient: doc.recipient,
    read: doc.read,
    createdAt: doc.createdAt
  };
}

export async function listNotifications(): Promise<NotificationRecord[]> {
  const docs = await Notification.find().lean();
  return docs.map(toRecord);
}

export async function getNotificationById(id: string): Promise<NotificationRecord | null> {
  const doc = await Notification.findById(id).lean();
  return doc ? toRecord(doc) : null;
}

export async function createNotification(data: Omit<NotificationRecord, "id">): Promise<NotificationRecord> {
  const doc = await Notification.create(data);
  await publishEvent("notification.created", toRecord(doc));
  return toRecord(doc);
}

export async function updateNotification(id: string, data: Omit<NotificationRecord, "id">): Promise<NotificationRecord | null> {
  const doc = await Notification.findByIdAndUpdate(id, data, { new: true }).lean();
  if (!doc) return null; // Notification not found
  await publishEvent("notification.updated", toRecord(doc));
  return toRecord(doc);
}

export async function deleteNotification(id: string): Promise<boolean> {
  const result = await Notification.findByIdAndDelete(id);
  if (!result) return false;
  await publishEvent("notification.deleted", { id });
  return true;
}

export async function markAsRead(id: string): Promise<NotificationRecord | null> {
  const doc = await Notification.findByIdAndUpdate(id, { read: true }, { new: true }).lean();
  return doc ? toRecord(doc) : null;
}