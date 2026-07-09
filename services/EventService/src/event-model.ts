import mongoose from "mongoose";

export interface IEvent extends mongoose.Document {
    title: string;
    location: string;
    capacity: number;
    price: number;
}

const eventSchema = new mongoose.Schema<IEvent>({
    title: {type: String, required: true},
    location: {type: String, required: true},
    capacity: {type: Number, required: true},
    price: {type: Number, required: true}
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);