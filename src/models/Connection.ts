import mongoose from 'mongoose';

const ConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  withUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending','accepted','declined'], default: 'pending', index: true },
  note: String,
}, { timestamps: true });

ConnectionSchema.index({ userId: 1, createdAt: -1 });

export const Connection = mongoose.model('Connection', ConnectionSchema);
