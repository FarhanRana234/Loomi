import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  firebaseId: string;
  email: string;
  username: string;
  role: "user" | "admin";
  bio: string;
  avatarUrl: string;
  socialLinks: { label: string; url: string }[];
}

const UserSchema = new Schema<IUserDocument>(
  {
    firebaseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    bio: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    socialLinks: {
      type: [
        {
          label: { type: String, required: true },
          url: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
