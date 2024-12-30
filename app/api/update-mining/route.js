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

    if (!user.isMining) {
      return NextResponse.json({ 
        message: 'No mining in progress',
        currentCoins: user.coins,
        isMining: false
      }, { status: 200 })
    }

    const currentTime = new Date()
    const lastUpdate = new Date(user.lastMiningUpdate)
    const endTime = new Date(user.miningEndTime)

    // Check if mining has ended
    if (currentTime >= endTime) {
      user.isMining = false
      user.miningStartTime = null
      user.miningEndTime = null
      user.lastMiningUpdate = currentTime

      let mining = await Mining.findOne({ username: user.username })
      if (mining) {
        mining.isMining = false
        mining.lastUpdate = currentTime
        mining.currentCoins = user.coins
        await mining.save()
      }

      await user.save()

      return NextResponse.json({
        currentCoins: user.coins,
        isMining: false,
        message: 'Mining completed'
      })
    }

    // Calculate earned coins based on mining speed
    const timeDiffInHours = (currentTime - lastUpdate) / (1000 * 60 * 60)
    const miningSpeed = user.miningSpeed || 0.005
    const earnedCoins = miningSpeed * timeDiffInHours

    user.coins += earnedCoins
    user.lastMiningUpdate = currentTime

    // Update mining record
    let mining = await Mining.findOne({ username: user.username })
    if (mining) {
      mining.currentCoins = user.coins
      mining.lastUpdate = currentTime
      await mining.save()
    }

    await user.save()

    return NextResponse.json({
      currentCoins: user.coins,
      isMining: true,
      earnedCoins,
      nextUpdate: currentTime.toISOString()
    })
  } catch (error) {
    console.error('Error updating mining:', error)
    return NextResponse.json({
      message: 'Failed to update mining',
      error: error.message
    }, { status: 500 })
  }
}