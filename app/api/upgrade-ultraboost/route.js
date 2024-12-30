import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

const ultraBoostUpgrades = [
  { level: 0, speed: 0.005, mineAmount: 0.02, claimTime: 4, cost: 500 },
  { level: 1, speed: 0.0625, mineAmount: 1.5, claimTime: 24, cost: 0 },
]

export async function POST(request) {
  await dbConnect()

  try {
    const { userId } = await request.json()

    const user = await User.findOne({ telegramId: userId })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const currentLevel = user.ultraBoostLevel || 0
    const nextUpgrade = ultraBoostUpgrades[currentLevel + 1]

    if (!nextUpgrade) {
      return NextResponse.json({ message: 'Maximum level reached' }, { status: 400 })
    }

    if (user.coins < nextUpgrade.cost) {
      return NextResponse.json({ message: 'Not enough coins' }, { status: 400 })
    }

    user.coins -= nextUpgrade.cost
    user.ultraBoostLevel = nextUpgrade.level
    user.miningSpeed = nextUpgrade.speed
    user.miningTime = nextUpgrade.claimTime

    await user.save()

    return NextResponse.json({
      coins: user.coins,
      ultraBoostLevel: user.ultraBoostLevel,
      miningSpeed: user.miningSpeed,
      miningTime: user.miningTime,
    })
  } catch (error) {
    console.error('Error during Ultra Boost upgrade:', error)
    return NextResponse.json({ message: 'Upgrade failed', error: error.message }, { status: 500 })
  }
}