import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request) {
  await dbConnect()
  
  try {
    // Get telegramId from the URL
    const telegramId = request.nextUrl.searchParams.get('telegramId')
    
    if (!telegramId) {
      return NextResponse.json({ message: 'Telegram ID is required' }, { status: 400 })
    }

    const user = await User.findOne({ telegramId })
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Return only the level-related data
    return NextResponse.json({
      speedLevel: user.speedLevel || 0,
      miningTimeLevel: user.miningTimeLevel || 0,
      ultraBoostLevel: user.ultraBoostLevel || 0,
      coins: user.coins || 0,
      miningSpeed: user.miningSpeed || 0.005,
      miningTime: user.miningTime || 8
    })
  } catch (error) {
    console.error('Error fetching user levels:', error)
    return NextResponse.json({ message: 'Failed to fetch user levels' }, { status: 500 })
  }
}