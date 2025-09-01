import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

const DICE_MULTIPLIERS = {
  1: 0,     // Lose all
  2: 0.5,   // Get half back
  3: 0.8,   // Small loss
  4: 1.2,   // Small win
  5: 2,     // Good win
  6: 3      // Big win!
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { betAmount } = await request.json()
    
    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: payload.userId })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.points < betAmount) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Roll the dice
    const diceResult = Math.floor(Math.random() * 6) + 1
    const multiplier = DICE_MULTIPLIERS[diceResult as keyof typeof DICE_MULTIPLIERS]
    const winnings = Math.floor(betAmount * multiplier)
    const newPoints = user.points - betAmount + winnings

    let outcome = 'lose'
    let message = 'You lost your bet!'
    
    if (diceResult === 6) {
      outcome = 'big_win'
      message = `🎉 JACKPOT! You won ${winnings} points!`
    } else if (diceResult >= 4) {
      outcome = 'win'
      message = `You won ${winnings} points!`
    } else if (diceResult === 3) {
      outcome = 'small_loss'
      message = `Small loss. You got ${winnings} points back.`
    } else if (diceResult === 2) {
      outcome = 'partial_refund'
      message = `Partial refund. You got ${winnings} points back.`
    }

    // Update user points and history
    const historyEntry = {
      game: 'dice_roll',
      points_bet: betAmount,
      dice_result: diceResult,
      outcome,
      points_won: winnings,
      timestamp: new Date()
    }

    await db.collection('users').updateOne(
      { _id: payload.userId },
      {
        $set: {
          points: newPoints,
          updatedAt: new Date()
        },
        $push: {
          'history.gambling': historyEntry
        }
      }
    )

    // Log in gamblelog
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString(),
      userId: payload.userId,
      game: 'dice_roll',
      points_spent: betAmount,
      outcome,
      details: {
        diceResult,
        multiplier,
        winnings
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      diceResult,
      multiplier,
      winnings,
      newPoints,
      outcome,
      message
    })

  } catch (error) {
    console.error('Dice roll error:', error)
    return NextResponse.json({ error: 'Dice roll failed' }, { status: 500 })
  }
}
