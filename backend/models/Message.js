import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  readAt: { type: Date, default: null, index: true }
}, { timestamps: true });
schema.index({ conversation: 1, createdAt: -1 });
export default mongoose.model('Message', schema);
