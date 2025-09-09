import mongoose from "mongoose";
import { Card } from "../src/models/Card.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set. Please add it to your .env file.");
  }

  await mongoose.connect(uri);
  console.log("✅ Connected to Mongo");

  try {
    await Card.collection.dropIndex("owner_1_slug_1");
    console.log("Dropped old index owner_1_slug_1");
  } catch (err: any) {
    console.log("No old index to drop:", err.message);
  }

  await Card.syncIndexes();
  console.log("✅ Synced indexes");

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
