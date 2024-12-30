import mongoose from 'mongoose';

const MiningSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  totalCoins: {
    type: Number,
    default: 0,
  },
  currentCoins: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  isMining: {
    type: Boolean,
    default: false,
  },
  lastUpdate: {
    type: Date,
    required: true,
  },
  miningSpeed: {
    type: Number,
    default: 0.005,
  },
  miningTime: {
    type: Number,
    default: 8,
  }
});

export default mongoose.models.Mining || mongoose.model('Mining', MiningSchema);