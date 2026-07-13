import mongoose, { Schema, Document } from "mongoose";

export interface IMoodboardDocument extends Document {
  name: string;
  description: string;
  userId: mongoose.Types.ObjectId;
  projectIds: mongoose.Types.ObjectId[];
  isPublic: boolean;
}

const MoodboardSchema = new Schema<IMoodboardDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MoodboardSchema.index({ userId: 1 });

export default mongoose.models.Moodboard ||
  mongoose.model<IMoodboardDocument>("Moodboard", MoodboardSchema);
