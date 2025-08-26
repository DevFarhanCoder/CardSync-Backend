import { Schema, model, Types } from "mongoose";

const ConnectionSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true }, // whose contact list it belongs to
    contactId: { type: Types.ObjectId, ref: "User" },               // optional if the contact is a user
    name: String,
    email: String,
    phone: String,
    source: { type: String, default: "card" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model("Connection", ConnectionSchema);
