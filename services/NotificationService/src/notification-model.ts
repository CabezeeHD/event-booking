import mongoose from "mongoose";

export interface INotification extends mongoose.Document {
    title: string;
    message: string;
    recipient: string;
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>({
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipient: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);