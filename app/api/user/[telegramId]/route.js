import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Mining from '@/models/Mining';

const MINING_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const COINS_PER_SESSION = 63; // Total coins per 8 hours
const COINS_PER_SECOND = COINS_PER_SESSION / (8 * 60 * 60); // Coins per second

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  await dbConnect();

  try {
    const { telegramId } = params;

    // Validate and convert telegramId to number
    const id = Number(telegramId);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid telegramId' }, { status: 400 });
    }

    // Fetch the user from the database
    let user = await User.findOne({ telegramId: id });

    // If user doesn't exist, return 404
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Fetch mining information
    let mining = await Mining.findOne({ username: user.username });

    return NextResponse.json({
      id: user.telegramId,
      coins: user.coins,
      level: user.level,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      tapEndTime: user.tapEndTime?.toISOString() || null,
      cooldownEndTime: user.cooldownEndTime?.toISOString() || null,
      isMining: user.isMining,
      miningStartTime: user.miningStartTime?.toISOString() || null,
      miningEndTime: user.miningEndTime?.toISOString() || null,
      lastMiningUpdate: user.lastMiningUpdate?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ message: 'Failed to fetch user data', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();

  try {
    const { id, action } = await request.json();

    // Validate and convert id to number
    const telegramId = Number(id);
    if (isNaN(telegramId)) {
      return NextResponse.json({ message: 'Invalid telegramId' }, { status: 400 });
    }

    // Fetch the user from the database
    let user = await User.findOne({ telegramId });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        telegramId,
        coins: 0,
        level: 1,
        lastTapTime: null,
        tapEndTime: null,
        cooldownEndTime: null,
        isMining: false,
        miningStartTime: null,
        miningEndTime: null,
        lastMiningUpdate: null,
      });
    }

    const now = new Date();

    if (action === 'startMining') {
      if (user.isMining) {
        return NextResponse.json({ message: 'Mining already in progress' }, { status: 400 });
      }

      user.isMining = true;
      user.miningStartTime = now;
      user.miningEndTime = new Date(now.getTime() + MINING_DURATION);
      user.lastMiningUpdate = now;

      let mining = await Mining.findOne({ username: user.username });
      if (!mining) {
        mining = new Mining({
          username: user.username,
          startTime: now,
          endTime: user.miningEndTime,
          totalCoins: user.coins,
          level: user.level,
          isMining: true,
          lastUpdate: now,
          currentCoins: user.coins
        });
      } else {
        mining.startTime = now;
        mining.endTime = user.miningEndTime;
        mining.totalCoins = user.coins;
        mining.level = user.level;
        mining.isMining = true;
        mining.lastUpdate = now;
        mining.currentCoins = user.coins;
      }

      await mining.save();
      await user.save();

      return NextResponse.json({
        message: 'Mining started successfully',
        coins: user.coins,
        level: user.level,
        isMining: true,
        miningEndTime: user.miningEndTime.toISOString(),
      });
    } else if (action === 'updateMining') {
      if (!user.isMining) {
        return NextResponse.json({ message: 'No mining in progress' }, { status: 400 });
      }

      const mining = await Mining.findOne({ username: user.username });
      if (!mining) {
        return NextResponse.json({ message: 'Mining session not found' }, { status: 404 });
      }

      const currentTime = new Date();
      const timeDiffInSeconds = (currentTime - mining.lastUpdate) / 1000;
      const earnedCoins = COINS_PER_SECOND * timeDiffInSeconds;

      user.coins += earnedCoins;
      user.lastMiningUpdate = currentTime;
      mining.currentCoins = user.coins;
      mining.lastUpdate = currentTime;

      if (currentTime >= user.miningEndTime) {
        user.isMining = false;
        user.miningStartTime = null;
        user.miningEndTime = null;
        mining.isMining = false;
      }

      await user.save();
      await mining.save();

      return NextResponse.json({
        coins: user.coins,
        level: user.level,
        isMining: user.isMining,
        miningEndTime: user.miningEndTime?.toISOString() || null,
      });
    } else {
      // Existing tap logic
      if (user.tapEndTime && now.getTime() < user.tapEndTime) {
        // User is in the tapping period
        user.coins += 1;

        // Check if level up is needed (every 1000 coins)
        const currentLevel = user.level;
        const coinsNeededForNextLevel = (currentLevel) * 1000;
        if (user.coins >= coinsNeededForNextLevel) {
          user.level += 1;
        }

        await user.save();

        return NextResponse.json({
          message: 'Tap time saved successfully.',
          coins: user.coins,
          level: user.level,
          tapEndTime: user.tapEndTime.toISOString(),
          cooldownEndTime: user.cooldownEndTime?.toISOString() || null,
        });
      } else if (user.cooldownEndTime && now.getTime() < user.cooldownEndTime) {
        // User is in the cooldown period
        return NextResponse.json({
          message: 'You are in the cooldown period. Please wait before tapping again.',
          coins: user.coins,
          level: user.level,
          tapEndTime: user.tapEndTime?.toISOString() || null,
          cooldownEndTime: user.cooldownEndTime.toISOString(),
        }, { status: 403 });
      } else {
        // User is not in the tapping or cooldown period
        user.lastTapTime = now;
        user.tapEndTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        user.cooldownEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
        user.coins += 1;

        // Check if level up is needed (every 1000 coins)
        const currentLevel = user.level;
        const coinsNeededForNextLevel = (currentLevel) * 1000;
        if (user.coins >= coinsNeededForNextLevel) {
          user.level += 1;
        }

        await user.save();

        return NextResponse.json({
          message: 'Tap time saved successfully.',
          coins: user.coins,
          level: user.level,
          tapEndTime: user.tapEndTime.toISOString(),
          cooldownEndTime: user.cooldownEndTime.toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ message: 'Failed to process request', error: error.message }, { status: 500 });
  }
}