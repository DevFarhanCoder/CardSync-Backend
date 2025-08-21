import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  headline: String,
  bio: String,
  company: String,
  location: String,
  defaultCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
