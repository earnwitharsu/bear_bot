// app/api/upgrade-storage/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

const STORAGE_UPGRADE_COSTS = [5, 10, 15, 20, 40, 60, 80, 100, 170]
const STORAGE_CLAIM_TIMES = [6, 8, 12, 24]

export async function POST(request) {
  await dbConnect()

  try {
    const { telegramId } = await request.json()

    const user = await User.findOne({ telegramId })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (user.storageLevel >= STORAGE_UPGRADE_COSTS.length) {
      return NextResponse.json({ message: 'Max storage level reached' }, { status: 400 })
    }

    const upgradeCost = STORAGE_UPGRADE_COSTS[user.storageLevel]
    if (user.coins < upgradeCost) {
      return NextResponse.json({ message: 'Insufficient coins' }, { status: 400 })
    }

    user.coins -= upgradeCost
    user.storageLevel++
    user.claimTime = STORAGE_CLAIM_TIMES[Math.min(user.storageLevel, STORAGE_CLAIM_TIMES.length - 1)]

    await user.save()

    return NextResponse.json({
      message: 'Storage upgraded successfully',
      newStorageLevel: user.storageLevel,
      newClaimTime: user.claimTime,
      remainingCoins: user.coins
    })
  } catch (error) {
    console.error('Error upgrading storage:', error)
    return NextResponse.json({ message: 'Failed to upgrade storage', error: error.message }, { status: 500 })
  }
}