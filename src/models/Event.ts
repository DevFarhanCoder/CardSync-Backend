import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventType: { type: String, required: true, index: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  metadata: { type: Object, default: {} },
  ip: String,
  userAgent: String,
}, { timestamps: true });

EventSchema.index({ createdAt: -1 });

export const Event = mongoose.model('Event', EventSchema);
