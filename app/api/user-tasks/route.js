import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json({ message: 'Missing telegramId' }, { status: 400 });
    }

    const user = await User.findOne({ telegramId: Number(telegramId) });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const tasks = await Task.find({});
    const userTasks = tasks.map(task => ({
      ...task.toObject(),
      completed: user.completedTasks?.includes(task._id.toString()) || false,
      coins: task.coins || 200 // Ensure coins field is always present
    }));

    return NextResponse.json({
      tasks: userTasks,
      userCoins: user.coins || 0
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user tasks', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
