import mongoose, { Schema, Document } from "mongoose";

export interface IMoodboardDocument extends Document {
  name: string;
  userId: string;
  projects: mongoose.Types.ObjectId[];
  isPublic: boolean;
}

const MoodboardSchema = new Schema<IMoodboardDocument>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: String, required: true, index: true },
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Moodboard ||
  mongoose.model<IMoodboardDocument>("Moodboard", MoodboardSchema);
