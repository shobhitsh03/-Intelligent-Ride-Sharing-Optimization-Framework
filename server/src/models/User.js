import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    roles: { type: [String], enum: ['driver', 'rider'], default: ['rider'] },
    phone: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
    // Wallet balance for internal payment system
    walletBalance: { type: Number, default: 0 },
    savedPaymentMethods: [{
      type: { type: String, enum: ['credit_card', 'upi'] },
      details: mongoose.Schema.Types.Mixed, // Encrypted payment details
      isDefault: { type: Boolean, default: false }
    }]
  },
  { timestamps: true }
);

UserSchema.index({ location: '2dsphere' });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', UserSchema);
