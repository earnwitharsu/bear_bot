import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

const miningTimeUpgrades = [
  { level: 0, time: 8, cost: 2 },
  { level: 1, time: 6, cost: 5 },
  { level: 2, time: 8, cost: 10 },
  { level: 3, time: 12, cost: 25 },
  { level: 4, time: 24, cost: 0 },
]

export async function POST(request) {
  await dbConnect()

  try {
    const { userId } = await request.json()

    const user = await User.findOne({ telegramId: userId })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const currentLevel = user.miningTimeLevel || 0
    const nextUpgrade = miningTimeUpgrades[currentLevel + 1]

    if (!nextUpgrade) {
      return NextResponse.json({ message: 'Maximum level reached' }, { status: 400 })
    }

    if (user.coins < nextUpgrade.cost) {
      return NextResponse.json({ message: 'Not enough coins' }, { status: 400 })
    }

    user.coins -= nextUpgrade.cost
    user.miningTimeLevel = nextUpgrade.level
    user.miningTime = nextUpgrade.time

    await user.save()

    return NextResponse.json({
      coins: user.coins,
      miningTimeLevel: user.miningTimeLevel,
      miningTime: user.miningTime,
    })
  } catch (error) {
    console.error('Error during mining time upgrade:', error)
    return NextResponse.json({ message: 'Upgrade failed', error: error.message }, { status: 500 })
  }
}