'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome back, {user.username}!</h1>
            <p className="text-white/70">Ready to play and earn points?</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Logout
          </Button>
        </div>

        {/* Points Display */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 mb-8">
          <div className="text-center">
            <h2 className="text-xl text-white/80 mb-2">Your Points</h2>
            <div className="text-5xl font-bold text-white mb-2">{user.points}</div>
            <p className="text-white/60">Use points for lifelines or try your luck gambling!</p>
          </div>
        </div>

        {/* Lifelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <h3 className="col-span-full text-2xl font-bold text-white mb-4">Your Lifelines</h3>
          {user.lifelines.map((lifeline) => (
            <div key={lifeline.lifelineId} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h4 className="text-lg font-semibold text-white mb-2">{lifeline.name}</h4>
              <p className="text-white/70 mb-4">Remaining uses: {lifeline.remaining_uses}</p>
              <Button 
                disabled={lifeline.remaining_uses === 0}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                Use Lifeline
              </Button>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-4">🎡 Spin Wheel</h3>
            <p className="text-white/70 mb-4">Try your luck! 10 points per spin</p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              Spin Now
            </Button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-4">🎲 Dice Roll</h3>
            <p className="text-white/70 mb-4">Bet your points for big wins!</p>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
              Roll Dice
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
