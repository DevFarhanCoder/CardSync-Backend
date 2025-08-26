import { Schema, model, Types } from "mongoose";

const ShareEventSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    cardId: { type: Types.ObjectId, ref: "Card", required: true },
    channel: { type: String, enum: ["qr", "link", "whatsapp", "email", "other"], default: "link" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model("ShareEvent", ShareEventSchema);
