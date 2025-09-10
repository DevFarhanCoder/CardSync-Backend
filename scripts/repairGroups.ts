/* scripts/repairGroups.ts */
import "dotenv/config";
import mongoose from "mongoose";
import { Group } from "../src/models/Group.js";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI/DATABASE_URL");
  await mongoose.connect(uri);
  console.log("Connected");

  const cursor = Group.find().cursor();
  let repaired = 0;
  for await (const g of cursor) {
    const owner = String(g.ownerId);
    let changed = false;
    if (!g.members?.some(m => String(m) === owner)) {
      g.members = [...(g.members || []), g.ownerId];
      changed = true;
    }
    if (!g.admins?.some(a => String(a) === owner)) {
      g.admins = [...(g.admins || []), g.ownerId];
      changed = true;
    }
    if (changed) { await g.save(); repaired++; }
  }
  console.log("Done. Repaired:", repaired);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
