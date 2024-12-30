// app/api/stats/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Mining from '@/models/Mining';

export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();

  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get active miners count
    const activeMiners = await User.countDocuments({ isMining: true });
    
    // Get total coins across all users
    const totalCoinsResult = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$coins' }
        }
      }
    ]);
    
    const totalCoins = totalCoinsResult[0]?.totalCoins || 0;

    // Get users grouped by level
    const usersByLevel = await User.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      totalUsers,
      activeMiners,
      totalCoins,
      usersByLevel,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch stats', error: error.message },
      { status: 500 }
    );
  }
}