import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { type: String, default: 'medium' },
  deadline: { type: Date },
  status: { type: String, default: 'todo' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  labels: [{ type: String }],
  checklist: [{ title: String, done: Boolean }],
  comments: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
