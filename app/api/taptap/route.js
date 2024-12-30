import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const MINING_LEVELS = Array.from({ length: 100 }, (_, i) => ({
  level: i + 1,
  coinsNeeded: (i + 1) * 1000
}));

export async function GET(request, { params }) {
  await dbConnect();

  try {
    const { telegramId } = params;

    const id = Number(telegramId);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid telegramId' }, { status: 400 });
    }

    let user = await User.findOne({ telegramId: id });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.telegramId,
      coins: user.coins,
      level: user.level,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ message: 'Failed to fetch user data', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();

  try {
    const { id } = await request.json();

    const telegramId = Number(id);
    if (isNaN(telegramId)) {
      return NextResponse.json({ message: 'Invalid telegramId' }, { status: 400 });
    }

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = new User({
        telegramId,
        coins: 0,
        level: 1,
      });
    }

    user.coins += 1;

    // Check if level up is needed
    while (user.level < 100 && user.coins >= MINING_LEVELS[user.level - 1].coinsNeeded) {
      user.level += 1;
    }

    await user.save();

    return NextResponse.json({
      message: 'Tap processed successfully.',
      coins: user.coins,
      level: user.level,
    });
  } catch (error) {
    console.error('Error processing tap:', error);
    return NextResponse.json({ message: 'Failed to process tap', error: error.message }, { status: 500 });
  }
}

export function generateStaticParams() {
  return []
}