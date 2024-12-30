import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Referral from '@/models/Referral';
import User from '@/models/User';

export async function GET(request, { params }) {
  await dbConnect();
  const referrerId = params.id;

  try {
    const referrals = await Referral.find({ referrerId }).sort({ date: -1 });
    const referredUsers = await User.find(
      { _id: { $in: referrals.map(r => r.referredId) } },
      'telegramId username'
    );

    const referralData = referrals.map(referral => {
      const user = referredUsers.find(u => u.telegramId === referral.referredId);
      return {
        username: user ? user.username : 'Anonymous',
        date: referral.date,
        bonusAmount: referral.bonusAmount,
        isPremium: referral.isPremium
      };
    });

    return NextResponse.json({ referrals: referralData });
  } catch (error) {
    console.error('Get referrals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}