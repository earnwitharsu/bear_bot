import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

const speedUpgrades = [
  { level: 1, speed: 0.005, mineAmount: 0.02, cost: 5 },
  { level: 2, speed: 0.01, mineAmount: 0.04, cost: 10 },
  { level: 3, speed: 0.05, mineAmount: 0.2, cost: 15 },
  { level: 4, speed: 0.1, mineAmount: 0.4, cost: 20 },
  { level: 5, speed: 0.25, mineAmount: 1, cost: 40 },
  { level: 6, speed: 0.4, mineAmount: 1.6, cost: 60 },
  { level: 7, speed: 0.6, mineAmount: 2.4, cost: 80 },
  { level: 8, speed: 0.8, mineAmount: 3.2, cost: 100 },
  { level: 9, speed: 1, mineAmount: 4, cost: 170 },
]

export async function POST(request) {
  await dbConnect()

  try {
    const { userId } = await request.json()

    const user = await User.findOne({ telegramId: userId })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const currentLevel = user.speedLevel || 0
    const nextUpgrade = speedUpgrades[currentLevel]

    if (!nextUpgrade) {
      return NextResponse.json({ message: 'Maximum level reached' }, { status: 400 })
    }

    if (user.coins < nextUpgrade.cost) {
      return NextResponse.json({ message: 'Not enough coins' }, { status: 400 })
    }

    user.coins -= nextUpgrade.cost
    user.speedLevel = nextUpgrade.level
    user.miningSpeed = nextUpgrade.speed

    await user.save()

    return NextResponse.json({
      coins: user.coins,
      speedLevel: user.speedLevel,
      miningSpeed: user.miningSpeed,
    })
  } catch (error) {
    console.error('Error during speed upgrade:', error)
    return NextResponse.json({ message: 'Upgrade failed', error: error.message }, { status: 500 })
  }
}