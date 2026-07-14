/**
 * Migration: category (string) -> categories (string[])
 *
 * One-time script that maps the old single `category` field
 * into the new `categories` array for all existing projects.
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node scripts/migrate-category-to-categories.js
 *   npx tsx scripts/migrate-category-to-categories.ts  (if using tsx)
 */

const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "loomi";

if (!MONGO_URI) {
  console.error("Missing MONGODB_URI environment variable.");
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const projects = db.collection("projects");

    // Find projects that have old `category` field but empty/missing `categories`
    const toMigrate = await projects
      .find({
        $or: [
          { categories: { $exists: false } },
          { categories: { $eq: [] } },
          { categories: null },
        ],
        category: { $exists: true, $ne: null, $ne: "" },
      })
      .toArray();

    console.log(`Found ${toMigrate.length} project(s) to migrate.`);

    if (toMigrate.length === 0) {
      console.log("Nothing to do.");
      return;
    }

    for (const doc of toMigrate) {
      const cat = (doc.category || "").trim().toLowerCase();
      if (!cat) continue;

      await projects.updateOne(
        { _id: doc._id },
        {
          $set: { categories: [cat] },
          $unset: { category: "" },
        }
      );
      console.log(`  Migrated project ${doc._id}: category="${doc.category}" -> categories=["${cat}"]`);
    }

    // Also clean up any remaining `category` fields on projects that already have `categories`
    const cleanup = await projects.updateMany(
      { category: { $exists: true } },
      { $unset: { category: "" } }
    );
    if (cleanup.modifiedCount > 0) {
      console.log(`Cleaned up ${cleanup.modifiedCount} stale category field(s).`);
    }

    console.log("Migration complete.");
  } finally {
    await client.close();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
