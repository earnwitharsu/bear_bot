import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

export async function POST(request) {
  await dbConnect();
  try {
    const { title, description, platform, url, coins } = await request.json();
    const task = await Task.create({
      title,
      description,
      status: 'pending',
      platform,
      url,
      coins,
      completedUsers: [],
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create task', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  await dbConnect();
  try {
    const tasks = await Task.find({});
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch tasks', error: error.message },
      { status: 500 }
    );
  }
}