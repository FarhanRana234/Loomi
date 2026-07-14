import mongoose, { Schema, Document } from "mongoose";

export interface ICommentDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  parentId: mongoose.Types.ObjectId | null;
}

const CommentSchema = new Schema<ICommentDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 1000 },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Comment ||
  mongoose.model<ICommentDocument>("Comment", CommentSchema);
