import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, unique: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  lastMessageAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });
schema.index({ participants: 1, lastMessageAt: -1 });
export default mongoose.model('Conversation', schema);
