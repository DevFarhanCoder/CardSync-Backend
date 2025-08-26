import { Schema, model, Types } from "mongoose";

const ViewEventSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },  // owner of the card
    cardId: { type: Types.ObjectId, ref: "Card", required: true },
    ip: String,
    ua: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model("ViewEvent", ViewEventSchema);
