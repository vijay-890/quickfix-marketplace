import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['CUSTOMER', 'PROVIDER', 'ADMIN'], default: 'CUSTOMER', immutable: true },
  phone: { type: String, trim: true, maxlength: 24, default: '' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true },
  lastSeenAt: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.verifyPassword = function (candidate) { return bcrypt.compare(candidate, this.password); };
userSchema.set('toJSON', { transform: (_doc, ret) => { delete ret.password; delete ret.__v; return ret; } });
export default mongoose.model('User', userSchema);
