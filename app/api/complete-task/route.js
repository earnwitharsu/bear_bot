import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { taskId, telegramId } = body;

    if (!taskId || !telegramId) {
      return NextResponse.json({ message: 'Missing taskId or telegramId' }, { status: 400 });
    }

    // Fetch the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    // Fetch the user
    let user = await User.findOne({ telegramId: Number(telegramId) });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if the user has already completed this task
    if (user.completedTasks && user.completedTasks.includes(taskId)) {
      return NextResponse.json({ message: 'Task already completed' }, { status: 400 });
    }

    // Get coins from the task (default to 200 if not set for backwards compatibility)
    const taskCoins = task.coins || 200;

    // Update user's coins and completed tasks
    user.coins = (user.coins || 0) + taskCoins;
    if (!user.completedTasks) {
      user.completedTasks = [];
    }
    user.completedTasks.push(taskId);
    await user.save();

    // Update task's completed users
    if (!task.completedUsers) {
      task.completedUsers = [];
    }
    task.completedUsers.push(telegramId);
    await task.save();

    return NextResponse.json({
      message: 'Task completed and coins awarded',
      user: {
        telegramId: user.telegramId,
        coins: user.coins,
        completedTasks: user.completedTasks
      },
      coinsEarned: taskCoins // Add this to show how many coins were earned
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { message: 'Failed to complete task', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}