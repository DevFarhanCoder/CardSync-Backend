import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const CardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  tagline: String,
  links: { type: [LinkSchema], default: [] },
  theme: String,
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

CardSchema.index({ userId: 1, createdAt: -1 });

export const Card = mongoose.model('Card', CardSchema);
