import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  await dbConnect();

  try {
    const userData = await request.json();

    // Validate the input
    if (!userData.id) {
      return NextResponse.json({ message: 'Invalid input data' }, { status: 400 });
    }

    // Find the user by id and update or create if not exists
    const updatedUser = await User.findOneAndUpdate(
      { telegramId: userData.id },
      { 
        $set: { 
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          languageCode: userData.language_code,
          isPremium: userData.is_premium,
          coins: userData.coins || 0,
          level: userData.level || 1
        } 
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: 'User data saved successfully',
      user: {
        id: updatedUser.telegramId,
        coins: updatedUser.coins,
        level: updatedUser.level
      }
    });
  } catch (error) {
    console.error('Error saving user data:', error);
    return NextResponse.json({ message: 'Failed to save user data', error: error.message }, { status: 500 });
  }
}