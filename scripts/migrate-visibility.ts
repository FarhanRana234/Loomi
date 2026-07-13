import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://chosoright:UfhFmyMJ8YWdtz2l@cluster0.4rgusvt.mongodb.net/?appName=Cluster0";

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;

  const result = await db.collection("moodboards").updateMany(
    {},
    [
      {
        $set: {
          visibility: {
            $cond: {
              if: { $eq: ["$isPublic", false] },
              then: "private",
              else: "public",
            },
          },
        },
      },
      { $unset: "isPublic" },
    ]
  );

  console.log(`Migrated ${result.modifiedCount} moodboards (isPublic → visibility)`);

  await mongoose.disconnect();
  console.log("Done.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
