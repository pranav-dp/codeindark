'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy, Medal, Award, Crown } from 'lucide-react'
import { motion } from 'framer-motion'

interface LeaderboardUser {
  rank: number
  username: string
  points: number
  lifelinesUsed: number
  gamesPlayed: number
  totalSpent: number
  joinedAt: string
}

export default function LeaderboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=20', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard)
        setTotalUsers(data.totalUsers)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />
      case 2: return <Medal className="w-6 h-6 text-gray-300" />
      case 3: return <Award className="w-6 h-6 text-amber-600" />
      default: return <Trophy className="w-5 h-5 text-white/60" />
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500'
      case 2: return 'from-gray-300 to-gray-500'
      case 3: return 'from-amber-600 to-yellow-700'
      default: return 'from-white/20 to-white/10'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const currentUserRank = leaderboard.find(u => u.username === user.username)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
              <p className="text-white/70">Top players by points</p>
            </div>
          </div>
        </div>

        {/* Current User Stats */}
        {currentUserRank && (
          <motion.div 
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl border border-white/20 p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getRankColor(currentUserRank.rank)} rounded-xl flex items-center justify-center`}>
                  {getRankIcon(currentUserRank.rank)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Rank: #{currentUserRank.rank}</h3>
                  <p className="text-white/70">{currentUserRank.points} points</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Out of {totalUsers} players</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {leaderboard.slice(0, 3).map((player, index) => {
            const actualRank = player.rank
            const podiumOrder = [1, 0, 2] // Second, First, Third
            const displayIndex = podiumOrder.indexOf(index)
            
            return (
              <motion.div
                key={player.username}
                className={`text-center ${actualRank === 1 ? 'order-2' : actualRank === 2 ? 'order-1' : 'order-3'}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <div className={`bg-gradient-to-br ${getRankColor(actualRank)} rounded-3xl p-6 ${actualRank === 1 ? 'scale-110' : ''}`}>
                  <div className="flex justify-center mb-4">
                    {getRankIcon(actualRank)}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{player.username}</h3>
                  <p className="text-2xl font-bold text-white mb-1">{player.points}</p>
                  <p className="text-white/70 text-sm">points</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Full Rankings</h3>
          
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <motion.div
                key={player.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/5 rounded-2xl p-4 border border-white/10 ${
                  player.username === user.username ? 'ring-2 ring-purple-500/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${getRankColor(player.rank)} rounded-xl flex items-center justify-center`}>
                      {player.rank <= 3 ? getRankIcon(player.rank) : (
                        <span className="text-white font-bold text-sm">#{player.rank}</span>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold flex items-center space-x-2">
                        <span>{player.username}</span>
                        {player.username === user.username && (
                          <span className="text-xs bg-purple-500 px-2 py-1 rounded-full">You</span>
                        )}
                      </h4>
                      <div className="flex space-x-4 text-white/60 text-xs">
                        <span>{player.lifelinesUsed} lifelines</span>
                        <span>{player.gamesPlayed} games</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{player.points}</p>
                    <p className="text-white/60 text-xs">points</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60">No players found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
