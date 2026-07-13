import mongoose, { Schema, Document } from "mongoose";

export interface IMoodboardDocument extends Document {
  name: string;
  userId: string;
  projects: mongoose.Types.ObjectId[];
  visibility: "public" | "private";
}

const MoodboardSchema = new Schema<IMoodboardDocument>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: String, required: true, index: true },
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Moodboard ||
  mongoose.model<IMoodboardDocument>("Moodboard", MoodboardSchema);
