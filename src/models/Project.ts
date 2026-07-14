import mongoose, { Schema, Document } from "mongoose";

export interface IProjectDocument extends Document {
  title: string;
  description: string;
  categories: string[];
  cloudinaryPublicId: string;
  mediaUrl: string;
  userId: mongoose.Types.ObjectId;
  likes: string[];
  views: number;
  status: "draft" | "published" | "flagged";
  protected: boolean;
  isDownloadable: boolean;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    categories: { type: [String], default: [], index: true },
    cloudinaryPublicId: { type: String, required: true },
    mediaUrl: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    likes: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "flagged"],
      default: "published",
    },
    protected: { type: Boolean, default: false },
    isDownloadable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProjectSchema.index({ title: "text", categories: "text" });

export default mongoose.models.Project ||
  mongoose.model<IProjectDocument>("Project", ProjectSchema);
