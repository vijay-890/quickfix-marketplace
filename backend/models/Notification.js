import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, enum: ['REQUEST_CREATED', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'STATUS_CHANGED', 'NEW_MESSAGE', 'SERVICE_COMPLETED', 'NEW_REVIEW', 'PROVIDER_STATUS'], required: true },
  title: { type: String, required: true, maxlength: 120 },
  body: { type: String, required: true, maxlength: 280 },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', default: null },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
  readAt: { type: Date, default: null, index: true }
}, { timestamps: true });
schema.index({ user: 1, createdAt: -1 });
export default mongoose.model('Notification', schema);
