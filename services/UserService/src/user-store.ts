import { User, UserStatus, IUser } from "./user-model";
import { publishEvent } from "./rabbitmq";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  createdAt: Date;
}

function toRecord(doc: any): UserRecord {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    status: doc.status,
    createdAt: doc.createdAt
  };
}

export async function listUsers(): Promise<UserRecord[]> {
  const docs = await User.find().lean();
  return docs.map(toRecord);
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const doc = await User.findById(id).lean();
  return doc ? toRecord(doc) : null;
}

export async function createUser(data: Pick<UserRecord, "email" | "name">): Promise<UserRecord> {
  const doc = await User.create({
    ...data,
    status: "active"
  });
  const record = toRecord(doc);
  await publishEvent("user.created", record);
  return record;
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<UserRecord | null> {
  const doc = await User.findByIdAndUpdate(id, { status }, { new: true }).lean();
  return doc ? toRecord(doc) : null;
}

export async function deleteUser(id: string): Promise<UserRecord | null> {
  const doc = await User.findByIdAndUpdate(id, { status: "inactive" }, { new: true }).lean();
  return doc ? toRecord(doc) : null;
}
