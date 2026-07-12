import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriberDocument extends Document {
  email: string;
  subscribedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriberDocument>(
  {
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.models.Subscriber ||
  mongoose.model<ISubscriberDocument>("Subscriber", SubscriberSchema);
