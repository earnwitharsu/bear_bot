// models/Referral.js
import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
  referrerId: {
    type: Number,
    required: true,
    ref: 'User'
  },
  referredId: {
    type: Number,
    required: true,
    unique: true,
    ref: 'User'
  },
  referralDate: {
    type: Date,
    default: Date.now
  },
  bonusAwarded: {
    type: Boolean,
    default: false
  },
  bonusAmount: {
    type: Number,
    default: 100
  }
});

ReferralSchema.index({ referrerId: 1, referredId: 1 });

ReferralSchema.pre('save', function(next) {
  if (this.referrerId === this.referredId) {
    next(new Error('A user cannot refer themselves'));
  } else {
    next();
  }
});

export default mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);