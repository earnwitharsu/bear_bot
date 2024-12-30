import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this task.'],
    maxlength: [60, 'Title cannot be more than 60 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for this task.'],
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  platform: {
    type: String,
    required: [true, 'Please provide a platform for this task.'],
  },
  url: {
    type: String,
    required: [true, 'Please provide a URL for this task.'],
  },
  coins: {
    type: Number,
    required: [true, 'Please specify the coins for this task.'],
    default: 10,
    min: [1, 'Coins must be at least 1'],
  },
  completedUsers: {
    type: [Number],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);