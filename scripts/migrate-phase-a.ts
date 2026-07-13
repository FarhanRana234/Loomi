import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://chosoright:UfhFmyMJ8YWdtz2l@cluster0.4rgusvt.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  console.log("Connected to MongoDB. Running Phase A migration...\n");

  // 1. Backfill category on projects missing it
  const projectsResult = await db
    .collection("projects")
    .updateMany({ category: { $exists: false } }, { $set: { category: "General" } });
  console.log(`Projects updated (category backfill): ${projectsResult.modifiedCount}`);

  // 2. Convert Moodboard userId from ObjectId to string
  const moodboards = await db.collection("moodboards").find({}).toArray();
  let converted = 0;
  for (const mb of moodboards) {
    if (mb.userId instanceof mongoose.Types.ObjectId) {
      await db
        .collection("moodboards")
        .updateOne(
          { _id: mb._id },
          { $set: { userId: mb.userId.toString() } }
        );
      converted++;
    }
  }
  console.log(`Moodboards updated (userId → string): ${converted}`);

  // 3. Rename projectIds → projects on moodboards
  let renamed = 0;
  for (const mb of moodboards) {
    if (mb.projectIds && !mb.projects) {
      await db
        .collection("moodboards")
        .updateOne(
          { _id: mb._id },
          { $set: { projects: mb.projectIds }, $unset: { projectIds: "" } }
        );
      renamed++;
    }
  }
  console.log(`Moodboards updated (projectIds → projects): ${renamed}`);

  // 4. Backfill website on users missing it
  const usersResult = await db
    .collection("users")
    .updateMany({ website: { $exists: false } }, { $set: { website: "" } });
  console.log(`Users updated (website backfill): ${usersResult.modifiedCount}`);

  // 5. Set default isPublic on moodboards missing it
  const publicResult = await db
    .collection("moodboards")
    .updateMany({ isPublic: { $exists: false } }, { $set: { isPublic: true } });
  console.log(`Moodboards updated (isPublic default): ${publicResult.modifiedCount}`);

  console.log("\nMigration complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
