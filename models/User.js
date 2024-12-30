// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  telegramId: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  username: { type: String, trim: true },
  languageCode: { type: String, trim: true },
  isPremium: { type: Boolean, default: false },
  coins: { 
    type: Number, 
    default: 0,
    min: [0, 'Coins cannot be negative']
  },
  level: { 
    type: Number, 
    default: 1,
    min: [1, 'Level cannot be less than 1']
  },
  isMining: { type: Boolean, default: false },
  miningStartTime: { type: Date },
  miningEndTime: { type: Date },
  lastMiningUpdate: { type: Date },
  speedLevel: { 
    type: Number, 
    default: 0,
    min: [0, 'Speed level cannot be negative']
  },
  miningSpeed: { 
    type: Number, 
    default: 0.005,
    min: [0, 'Mining speed cannot be negative']
  },
  miningTimeLevel: { 
    type: Number, 
    default: 0,
    min: [0, 'Mining time level cannot be negative']
  },
  miningTime: { 
    type: Number, 
    default: 8,
    min: [1, 'Mining time must be at least 1 hour'],
    max: [24, 'Mining time cannot exceed 24 hours']
  },
  totalReferrals: { 
    type: Number, 
    default: 0,
    min: [0, 'Total referrals cannot be negative']
  },
}, {
  timestamps: true
});

UserSchema.methods.canStartMining = function() {
  return !this.isMining && (!this.miningEndTime || new Date() > this.miningEndTime);
};

UserSchema.methods.calculateMiningRewards = function() {
  if (!this.isMining || !this.miningStartTime || !this.lastMiningUpdate) {
    return 0;
  }

  const now = new Date();
  const timeDiff = (now - this.lastMiningUpdate) / 3600000; // Convert to hours
  const rewards = this.miningSpeed * timeDiff;

  return Math.min(rewards, this.calculateMaxRewards());
};

UserSchema.methods.calculateMaxRewards = function() {
  return this.miningSpeed * this.miningTime;
};

UserSchema.pre('save', function(next) {
  if (this.isModified('isMining') && this.isMining) {
    this.miningStartTime = new Date();
    this.miningEndTime = new Date(this.miningStartTime.getTime() + this.miningTime * 3600000);
    this.lastMiningUpdate = this.miningStartTime;
  }
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);