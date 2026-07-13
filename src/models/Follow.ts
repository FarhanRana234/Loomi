import mongoose, { Schema, Document } from "mongoose";

export interface IFollowDocument extends Document {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollowDocument>(
  {
    followerId: {
      type: String,
      required: true,
    },
    followingId: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 });
FollowSchema.index({ followerId: 1 });

export default mongoose.models.Follow ||
  mongoose.model<IFollowDocument>("Follow", FollowSchema);
