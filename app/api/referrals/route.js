import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Referral from '@/models/Referral';

export async function POST(request) {
  await dbConnect();
  const { userId, referrerId, isPremium } = await request.json();

  if (userId === referrerId) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
  }

  const existingUser = await User.findOne({ telegramId: userId });
  if (existingUser && existingUser.referredBy) {
    return NextResponse.json({ error: 'User already referred' }, { status: 400 });
  }

  const bonusAmount = isPremium ? 30 : 10;

  try {
    await Referral.create({
      referrerId,
      referredId: userId,
      isPremium,
      bonusAmount
    });

    await User.findOneAndUpdate(
      { telegramId: referrerId },
      { $inc: { coins: bonusAmount, totalReferrals: 1 } }
    );

    await User.findOneAndUpdate(
      { telegramId: userId },
      { $inc: { coins: bonusAmount }, referredBy: referrerId },
      { upsert: true }
    );

    return NextResponse.json({ success: true, bonusAmount });
  } catch (error) {
    console.error('Referral error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}