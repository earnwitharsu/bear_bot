// app/api/checkUser/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Referral from '@/models/Referral';

export async function POST(request) {
  try {
    await dbConnect();

    const { userId, referrerId, ...userData } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'Missing userId' }, { status: 400 });
    }

    let user = await User.findOne({ telegramId: userId });
    let isNewUser = false;
    let referralStatus = null;

    if (!user) {
      // New user
      isNewUser = true;
      try {
        user = await User.create({
          telegramId: userId,
          coins: 0,
          level: 1,
          ...userData
        });
      } catch (error) {
        if (error.code === 11000 && error.keyPattern.telegramId) {
          // If the error is due to a duplicate telegramId, fetch the existing user
          user = await User.findOne({ telegramId: userId });
          isNewUser = false;
        } else {
          throw error; // If it's a different error, rethrow it
        }
      }

      if (isNewUser && referrerId) {
        const referrer = await User.findOne({ telegramId: referrerId });
        if (referrer) {
          // Create referral record
          await Referral.create({
            referrerId: referrerId,
            referredId: userId,
            bonusAwarded: true,
          });

          // Award bonus to both users
          user.coins += 100;
          referrer.coins += 100;
          await referrer.save();
          await user.save();

          referralStatus = 'referred';
        }
      }
    }

    // Update user data
    if (!isNewUser) {
      Object.assign(user, userData);
      await user.save();
    }

    return NextResponse.json({
      isNewUser,
      coins: user.coins,
      referralStatus,
      isMining: user.isMining || false,
    });
  } catch (error) {
    console.error('Error checking/creating user:', error);
    return NextResponse.json(
      { message: 'Failed to check/create user', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}