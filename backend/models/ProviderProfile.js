import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  bio: { type: String, trim: true, maxlength: 700, default: '' },
  skills: [{ type: String, trim: true, maxlength: 60 }],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' }],
  experienceYears: { type: Number, min: 0, max: 60, default: 0 },
  hourlyRate: { type: Number, min: 0, default: 0 },
  serviceArea: { type: String, trim: true, maxlength: 120, default: '' },
  status: { type: String, enum: ['OFFLINE', 'ONLINE', 'BUSY'], default: 'OFFLINE', index: true },
  ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  photo: { type: String, default: '' }
}, { timestamps: true });
schema.index({ categories: 1, status: 1, ratingAverage: -1 });
export default mongoose.model('ProviderProfile', schema);
