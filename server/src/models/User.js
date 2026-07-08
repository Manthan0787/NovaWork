import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'member' },
  avatar: { type: String, default: '' },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
