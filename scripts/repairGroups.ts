import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
import { Group } from "../src/models/Group.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI not set");
  await mongoose.connect(uri);
  console.log("Connected");

  const groups = await Group.find().lean();
  let fixed = 0;
  for (const g of groups) {
    const owner = String(g.ownerId);
    const hasOwner = (g.members || []).some((m: any) => String(m) === owner);
    if (!hasOwner) {
      await Group.updateOne(
        { _id: g._id },
        { $addToSet: { members: new Types.ObjectId(owner) } }
      );
      fixed++;
    }
  }
  console.log(`Done. Repaired: ${fixed}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
