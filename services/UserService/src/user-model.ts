import mongoose from "mongoose";

export type UserStatus = "active" | "inactive" | "suspended";

export interface IUser extends mongoose.Document {
  email: string;
  name: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active"
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
