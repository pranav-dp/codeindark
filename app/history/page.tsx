'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, TrendingUp, TrendingDown, Zap, Dice1, Users, Eye, HelpCircle, RotateCcw, Target, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

interface HistoryItem {
  id: string
  type: 'lifeline' | 'gambling' | 'sabotage_sent' | 'sabotage_received'
  timestamp: string
  // Lifeline fields
  lifelineId?: string
  name?: string
  points_spent?: number
  // Gambling fields
  game?: string
  points_bet?: number
  points_won?: number
  outcome?: string
  dice_result?: number
  // Sabotage fields
  targetUsername?: string
  attackerUsername?: string
  sabotage?: string
  pointsSpent?: number
  pointsLost?: number
}

interface Stats {
  totalLifelinesUsed: number
  totalGamblingGames: number
  totalSabotagesSent: number
  totalSabotagesReceived: number
  totalPointsSpent: number
  totalPointsWon: number
  totalPointsLost: number
}

const lifelineIcons: { [key: string]: any } = {
  'Skip Question': RotateCcw,
  'Ask Expert': Users,
  '50-50': Eye,
  'Hint': HelpCircle,
  'Retry': RotateCcw
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [stats, setStats] = useState<Stats>({
    totalLifelinesUsed: 0,
    totalGamblingGames: 0,
    totalSabotagesSent: 0,
    totalSabotagesReceived: 0,
    totalPointsSpent: 0,
    totalPointsWon: 0,
    totalPointsLost: 0
  })
  const [filter, setFilter] = useState<'all' | 'lifelines' | 'gambling' | 'sabotage'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only redirect after loading is complete
    if (loading) return
    
    if (!user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user, filter])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/user/history?type=${filter}&limit=100`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getItemIcon = (item: HistoryItem) => {
    if (item.type === 'lifeline') {
      const IconComponent = lifelineIcons[item.name || ''] || Zap
      return <IconComponent className="w-5 h-5" />
    } else if (item.type === 'sabotage_sent' || item.type === 'sabotage_received') {
      return <Target className="w-5 h-5" />
    } else {
      return item.game === 'scratch_strike' ? <span className="text-lg">⚡</span> :
             item.game === 'dice_roll' ? <Dice1 className="w-5 h-5" /> : <span className="text-lg">🎰</span>
    }
  }

  const getItemColor = (item: HistoryItem) => {
    if (item.type === 'lifeline') return 'from-purple-500 to-pink-500'
    if (item.type === 'sabotage_sent') return 'from-red-500 to-orange-500'
    if (item.type === 'sabotage_received') return 'from-red-600 to-red-800'
    if (item.outcome === 'win' || item.outcome === 'big_win') return 'from-green-500 to-emerald-500'
    if (item.outcome === 'lose') return 'from-red-500 to-rose-500'
    return 'from-blue-500 to-cyan-500'
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="glass"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Transaction History</h1>
              <p className="text-white/70">Track your lifeline usage and gambling results</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card variant="glass-rounded" className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Lifelines Used</p>
                  <p className="text-2xl font-bold text-white">{stats.totalLifelinesUsed}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Dice1 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Games Played</p>
                <p className="text-2xl font-bold text-white">{stats.totalGamblingGames}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Sabotages</p>
                <p className="text-2xl font-bold text-white">{stats.totalSabotagesSent}/{stats.totalSabotagesReceived}</p>
                <p className="text-white/40 text-xs">Sent/Received</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Net Points</p>
                <p className="text-2xl font-bold text-white">{stats.totalPointsWon - stats.totalPointsSpent - stats.totalPointsLost}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-4 mb-6">
          {(['all', 'lifelines', 'gambling', 'sabotage'] as const).map((filterType) => (
            <Button
              key={filterType}
              onClick={() => setFilter(filterType)}
              variant={filter === filterType ? 'default' : 'outline'}
              className={filter === filterType 
                ? 'bg-white/20 text-white' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>

        {/* History List */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 rounded-2xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getItemColor(item)} rounded-xl flex items-center justify-center`}>
                        {getItemIcon(item)}
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold">
                          {item.type === 'lifeline' ? item.name : 
                           item.type === 'sabotage_sent' ? `Sabotaged ${item.targetUsername}` :
                           item.type === 'sabotage_received' ? `Sabotaged by ${item.attackerUsername}` :
                           item.game === 'scratch_strike' ? 'Scratch Strike' :
                           item.game === 'dice_roll' ? 'Dice Roll' : 'Slot Machine'}
                        </h4>
                        <p className="text-white/60 text-sm">{formatDate(item.timestamp)}</p>
                        {(item.type === 'sabotage_sent' || item.type === 'sabotage_received') && (
                          <p className="text-red-400 text-xs">with {item.sabotage}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {item.type === 'lifeline' ? (
                        <p className="text-red-400 font-semibold">-{item.points_spent} pts</p>
                      ) : item.type === 'sabotage_sent' ? (
                        <p className="text-red-400 font-semibold">-{item.pointsSpent} pts</p>
                      ) : item.type === 'sabotage_received' ? (
                        <p className="text-red-400 font-semibold">-{item.pointsLost} pts</p>
                      ) : (
                        <div>
                          <p className="text-red-400 text-sm">-{item.points_spent || item.points_bet} pts</p>
                          {item.points_won! > 0 && (
                            <p className="text-green-400 font-semibold">+{item.points_won} pts</p>
                          )}
                          {item.game === 'dice_roll' && (
                            <p className="text-white/60 text-xs">Rolled: {item.dice_result}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
