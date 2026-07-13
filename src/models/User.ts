import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  firebaseId: string;
  email: string;
  username: string;
  role: "user" | "admin";
  bio: string;
  avatarUrl: string;
  website: string;
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
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 150,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    website: {
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
