import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const db = await getDb()
    
    // Get AGAINST powerups for admin use
    const againstPowerups = await db.collection('lifelines').find({ 
      type: 'AGAINST',
      admin_only: true,
      isActive: true 
    }).toArray()

    // Get all users for targeting
    const users = await db.collection('users').find({ 
      isActive: true 
    }).project({ 
      _id: 1, 
      username: 1, 
      points: 1,
      isAdmin: 1 
    }).toArray()

    return NextResponse.json({
      powerups: againstPowerups.map(p => ({
        id: p._id,
        name: p.name,
        description: p.description,
        cost: p.point_cost,
        duration: p.duration_seconds,
        instructions: p.special_instructions,
        points_deducted: p.points_deducted || 0,
        timer_reduction: p.timer_reduction || 0
      })),
      users: users.map(u => ({
        id: u._id,
        username: u.username,
        points: u.points,
        isAdmin: u.isAdmin
      }))
    })

  } catch (error) {
    console.error('Admin powerups fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin powerups' }, { status: 500 })
  }
}
