import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

interface UpsertUserOpts {
  firebaseId: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  hasPassword?: boolean;
}

export async function upsertUserByEmail(opts: UpsertUserOpts) {
  await connectToDatabase();

  let user = await User.findOne({ firebaseId: opts.firebaseId }).select("-__v");

  if (user) return user;

  const existingByEmail = await User.findOne({ email: opts.email });

  if (existingByEmail) {
    existingByEmail.firebaseId = opts.firebaseId;
    if (opts.hasPassword) existingByEmail.hasPassword = true;
    if (opts.avatarUrl && !existingByEmail.avatarUrl) {
      existingByEmail.avatarUrl = opts.avatarUrl;
    }
    await existingByEmail.save();
    return existingByEmail;
  }

  user = await User.create({
    firebaseId: opts.firebaseId,
    email: opts.email,
    username: opts.username || opts.email.split("@")[0],
    avatarUrl: opts.avatarUrl || "",
    hasPassword: opts.hasPassword ?? false,
  });

  return user;
}
