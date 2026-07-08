import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'active' },
  priority: { type: String, default: 'medium' },
  deadline: { type: Date },
  category: { type: String, default: 'general' },
  color: { type: String, default: '#6366f1' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  archived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
