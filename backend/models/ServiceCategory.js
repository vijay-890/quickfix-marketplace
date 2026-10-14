import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true, maxlength: 220, default: '' },
  icon: { type: String, default: '🛠️' },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });
export default mongoose.model('ServiceCategory', schema);
