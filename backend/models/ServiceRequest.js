import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
  title: { type: String, required: true, trim: true, minlength: 4, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1800 },
  budget: { type: Number, required: true, min: 1, max: 1000000 },
  address: { type: String, required: true, trim: true, minlength: 4, maxlength: 240 },
  city: { type: String, trim: true, maxlength: 100, default: '' },
  mapLocation: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  },
  preferredDate: { type: Date, default: null },
  status: { type: String, enum: ['OPEN', 'ACCEPTED', 'PROVIDER_ON_THE_WAY', 'STARTED', 'COMPLETED', 'CANCELLED'], default: 'OPEN', index: true },
  images: [{ type: String }],
  rejectionCount: { type: Number, default: 0 }
}, { timestamps: true });
schema.index({ status: 1, category: 1, city: 1, createdAt: -1 });
schema.index({ customer: 1, createdAt: -1 });
schema.index({ provider: 1, status: 1, createdAt: -1 });
export default mongoose.model('ServiceRequest', schema);
