import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

export async function PUT(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;
    const { title, description, platform, url, status, coins } = await request.json();
    
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title, description, platform, url, status, coins },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update task', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to delete task', error: error.message },
      { status: 500 }
    );
  }
}