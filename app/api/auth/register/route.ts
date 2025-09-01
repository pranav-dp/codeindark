import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const db = await getDb()
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ 
      $or: [{ email }, { username: name }] 
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Get all lifelines to assign to new user
    const lifelines = await db.collection('lifelines').find().toArray()
    const userLifelines = lifelines.map(l => ({
      lifelineId: l._id,
      name: l.name,
      remaining_uses: l.max_uses
    }))

    // Create new user
    const hashedPassword = await hashPassword(password)
    const userId = new Date().getTime().toString()
    
    const newUser = {
      _id: userId,
      username: name,
      email,
      password: hashedPassword,
      points: 100,
      isActive: true,
      isAdmin: false,
      lifelines: userLifelines,
      history: {
        lifeline_usage: [],
        gambling: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('users').insertOne(newUser)

    // Generate token
    const token = generateToken({
      userId: newUser._id,
      email: newUser.email,
      username: newUser.username,
      isAdmin: false
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        points: newUser.points,
        isAdmin: false,
        lifelines: newUser.lifelines
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Registration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
