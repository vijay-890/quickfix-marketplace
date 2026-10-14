import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true });
export default mongoose.model('Review', schema);
