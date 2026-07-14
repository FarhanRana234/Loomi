import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID!;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL!;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY!.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

async function run() {
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY }),
    });
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const User = mongoose.model("User", new mongoose.Schema({
    firebaseId: String,
    email: String,
    username: String,
    hasPassword: { type: Boolean, default: false },
  }, { strict: false }));

  const users = await User.find({ hasPassword: { $ne: true } }).lean();
  console.log(`Found ${users.length} users without hasPassword=true`);

  const auth = getAuth();
  let updated = 0;

  for (const user of users) {
    try {
      const firebaseUser = await auth.getUser(user.firebaseId);
      const hasEmailProvider = firebaseUser.providerData.some((p) => p.providerId === "password");
      if (hasEmailProvider) {
        await User.updateOne({ _id: user._id }, { $set: { hasPassword: true } });
        updated++;
        console.log(`  ✓ ${user.username} (${user.firebaseId}) — has password provider`);
      } else {
        console.log(`  - ${user.username} (${user.firebaseId}) — Google-only, skipping`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${user.username} (${user.firebaseId}) — error: ${msg}`);
    }
  }

  console.log(`\nDone. Updated ${updated}/${users.length} users.`);
  await mongoose.disconnect();
}

run().catch(console.error);
