import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Mining from '@/models/Mining'

export async function POST(request) {
  await dbConnect()

  try {
    const { telegramId } = await request.json()

    const id = Number(telegramId)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid telegramId' }, { status: 400 })
    }

    const user = await User.findOne({ telegramId: id })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Check if user is already mining
    if (user.isMining) {
      const now = new Date()
      const endTime = new Date(user.miningEndTime)
      
      // If mining has ended, update the state
      if (now >= endTime) {
        user.isMining = false
        user.miningStartTime = null
        user.miningEndTime = null
        await user.save()
      } else {
        return NextResponse.json({
          message: 'Mining already in progress',
          endTime: user.miningEndTime,
          startTime: user.miningStartTime,
          isMining: true,
          coins: user.coins,
          level: user.level
        })
      }
    }

    const currentTime = new Date()
    const miningDuration = (user.miningTime || 8) * 60 * 60 * 1000 // Convert hours to milliseconds
    const endTime = new Date(currentTime.getTime() + miningDuration)

    user.isMining = true
    user.miningStartTime = currentTime
    user.miningEndTime = endTime
    user.lastMiningUpdate = currentTime

    // Update or create mining record
    let mining = await Mining.findOne({ username: user.username })
    if (!mining) {
      mining = new Mining({
        username: user.username,
        startTime: currentTime,
        endTime,
        totalCoins: user.coins,
        level: user.level,
        isMining: true,
        lastUpdate: currentTime,
        currentCoins: user.coins,
        miningSpeed: user.miningSpeed,
        miningTime: user.miningTime
      })
    } else {
      mining.startTime = currentTime
      mining.endTime = endTime
      mining.totalCoins = user.coins
      mining.level = user.level
      mining.isMining = true
      mining.lastUpdate = currentTime
      mining.currentCoins = user.coins
      mining.miningSpeed = user.miningSpeed
      mining.miningTime = user.miningTime
    }

    await Promise.all([mining.save(), user.save()])

    return NextResponse.json({
      message: 'Mining started successfully',
      endTime,
      startTime: currentTime,
      isMining: true,
      coins: user.coins,
      level: user.level,
      miningSpeed: user.miningSpeed,
      miningTime: user.miningTime
    })
  } catch (error) {
    console.error('Error in mining operation:', error)
    return NextResponse.json({
      message: 'Failed to process mining operation',
      error: error.message
    }, { status: 500 })
  }
}