// app/api/tasks/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';

export async function POST(request) {
  await dbConnect();

  try {
    const { platform, telegramId } = await request.json();

    // Fetch the task based on the platform
    const task = await Task.findOne({ platform });
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    // Fetch the user based on the Telegram ID
    let user = await User.findOne({ telegramId });
    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        telegramId,
        completedTasks: [],
      });
    }

    // Check if the user has already completed the task
    if (user.completedTasks.includes(task._id)) {
      return NextResponse.json({ message: 'You have already completed this task' }, { status: 403 });
    }

    // Add the task to the user's completed tasks
    user.completedTasks.push(task._id);
    await user.save();

    // Add the user to the task's completed users
    task.completedUsers.push(user.telegramId);
    await task.save();

    return NextResponse.json({ message: 'Task completed successfully' });
  } catch (error) {
    console.error('Error processing task completion:', error);
    return NextResponse.json({ message: 'Failed to complete task', error: error.message }, { status: 500 });
  }
}