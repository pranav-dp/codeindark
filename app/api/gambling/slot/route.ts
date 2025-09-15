import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

const SLOT_COST = 10
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎']

const PAYOUTS = {
  '💎💎💎': 500,  // Jackpot
  '⭐⭐⭐': 200,   // Triple star
  '🍒🍒🍒': 100,  // Triple cherry
  '🍇🍇🍇': 80,   // Triple grape
  '🍊🍊🍊': 60,   // Triple orange
  '🍋🍋🍋': 40,   // Triple lemon
  '💎💎': 50,     // Double diamond
  '⭐⭐': 30,      // Double star
  '🍒🍒': 20,     // Double cherry
}

function spinSlots() {
  const result = [
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
  ]
  
  const resultString = result.join('')
  let payout = 0
  let outcome = 'lose'
  
  // Check for wins
  if ((PAYOUTS as any)[resultString]) {
    payout = (PAYOUTS as any)[resultString]
    outcome = 'win'
  } else {
    // Check for doubles
    const doubleKey = result[0] + result[1]
    if (result[0] === result[1] && (PAYOUTS as any)[doubleKey]) {
      payout = (PAYOUTS as any)[doubleKey]
      outcome = 'small_win'
    }
  }
  
  return { result, payout, outcome }
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

    // Rate limiting: 30 spins per minute
    const rateLimitResult = rateLimit(`slot_${payload.userId}`, 30, 60000)
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Try again later.',
        resetTime: rateLimitResult.resetTime
      }, { status: 429 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: payload.userId as any })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.points < SLOT_COST) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Spin the slots
    const { result, payout, outcome } = spinSlots()
    const newPoints = user.points - SLOT_COST + payout

    // Update user points and history
    const historyEntry = {
      game: 'slot_machine',
      points_spent: SLOT_COST,
      outcome,
      points_won: payout,
      timestamp: new Date()
    }

    await db.collection('users').updateOne(
      { _id: payload.userId as any },
      {
        $set: {
          points: newPoints,
          updatedAt: new Date()
        },
        $push: {
          'history.gambling': historyEntry as any
        }
      }
    )

    // Log in gamblelog
    await db.collection('gamblelog').insertOne({
      _id: new Date().getTime().toString() as any,
      userId: payload.userId,
      game: 'slot_machine',
      points_spent: SLOT_COST,
      outcome,
      details: {
        result,
        payout
      },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      result,
      payout,
      outcome,
      newPoints,
      remaining: rateLimitResult.remaining,
      message: payout > 0 ? `You won ${payout} points!` : 'Better luck next time!'
    })

  } catch (error) {
    console.error('Slot machine error:', error)
    return NextResponse.json({ error: 'Slot machine failed' }, { status: 500 })
  }
}
