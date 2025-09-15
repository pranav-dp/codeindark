'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Activity, Users, Zap, Dice1, RotateCcw, Eye, HelpCircle, Plus, Minus, Target } from 'lucide-react'
import { motion } from 'framer-motion'

interface ActivityItem {
  id: string
  type?: 'lifeline' | 'gambling'
  game?: string
  username: string
  timestamp: string
  points_spent?: number
  points_bet?: number
  points_won?: number
  outcome?: string
  name?: string
  dice_result?: number
}

interface User {
  id: string
  username: string
  email: string
  points: number
  isActive: boolean
  isAdmin?: boolean
}

interface Powerup {
  id: string
  name: string
  description: string
  cost: number
  duration: number
  instructions: string
  points_deducted?: number
  timer_reduction?: number
}

const activityIcons: { [key: string]: any } = {
  'lifeline': Zap,
  'slot_machine': '🎰',
  'dice_roll': Dice1,
  'Skip Question': RotateCcw,
  'Ask Expert': Users,
  '50-50': Eye,
  'Hint': HelpCircle,
  'Retry': RotateCcw
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<'realtime' | 'userwise' | 'controls'>('realtime')
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Powerup control states
  const [againstPowerups, setAgainstPowerups] = useState<Powerup[]>([])
  const [selectedPowerup, setSelectedPowerup] = useState<string>('')
  const [targetUserId, setTargetUserId] = useState<string>('')
  const [pointAmount, setPointAmount] = useState<number>(0)
  const [pointAction, setPointAction] = useState<'add' | 'subtract'>('add')

  // Don't redirect, just show access denied if not admin
  // useEffect(() => {
  //   if (loading) return
  //   if (!user || !user.isAdmin) {
  //     router.replace('/')
  //   }
  // }, [user, loading, router])

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchUsers()
      fetchActivity()
      fetchAgainstPowerups()
    }
  }, [user, view, selectedUserId])

  // Auto-refresh for real-time view
  useEffect(() => {
    if (view === 'realtime' && autoRefresh) {
      const interval = setInterval(() => {
        fetchActivity()
      }, 3000) // Refresh every 3 seconds

      return () => clearInterval(interval)
    }
  }, [view, autoRefresh])

  const fetchAgainstPowerups = async () => {
    try {
      const response = await fetch('/api/admin/powerups', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setAgainstPowerups(data.powerups)
      }
    } catch (error) {
      console.error('Failed to fetch powerups:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchActivity = async () => {
    try {
      const url = view === 'userwise' && selectedUserId 
        ? `/api/admin/activity?userId=${selectedUserId}&limit=100`
        : '/api/admin/activity?limit=50'
      
      const response = await fetch(url, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setActivity(data.activity)
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const triggerPowerup = async () => {
    if (!selectedPowerup || !targetUserId) return
    
    try {
      const response = await fetch('/api/admin/trigger-powerup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: targetUserId,
          powerupId: selectedPowerup
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`${data.powerup.name} triggered on ${data.user.username}!`)
        fetchUsers() // Refresh user points
        fetchActivity() // Refresh activity
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to trigger powerup:', error)
      alert('Failed to trigger powerup')
    }
  }

  const managePoints = async () => {
    if (!targetUserId || pointAmount <= 0) return
    
    try {
      const response = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: targetUserId,
          points: pointAmount,
          action: pointAction,
          reason: `Admin ${pointAction} points`
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        fetchUsers() // Refresh user points
        setPointAmount(0)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to manage points:', error)
      alert('Failed to manage points')
    }
  }
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return time.toLocaleDateString()
  }

  const getActivityIcon = (item: ActivityItem) => {
    if (item.type === 'lifeline') {
      const IconComponent = activityIcons[item.name || ''] || Zap
      return <IconComponent className="w-5 h-5" />
    } else if (item.game === 'slot_machine') {
      return <span className="text-lg">🎰</span>
    } else {
      return <Dice1 className="w-5 h-5" />
    }
  }

  const getActivityColor = (item: ActivityItem) => {
    if (item.type === 'lifeline') return 'from-purple-500 to-pink-500'
    if (item.outcome === 'win' || item.outcome === 'big_win') return 'from-green-500 to-emerald-500'
    if (item.outcome === 'lose') return 'from-red-500 to-rose-500'
    return 'from-blue-500 to-cyan-500'
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white">Access Denied</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🔧 Admin Monitor</h1>
            <p className="text-white/70">Real-time user activity monitoring</p>
          </div>

          {/* View Toggle and Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-white/10 rounded-xl p-1">
              <Button
                onClick={() => setView('realtime')}
                size="sm"
                className={view === 'realtime' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-transparent text-white/70 hover:text-white'
                }
              >
                <Activity className="w-4 h-4 mr-2" />
                Real-time
              </Button>
              <Button
                onClick={() => setView('userwise')}
                size="sm"
                className={view === 'userwise' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-transparent text-white/70 hover:text-white'
                }
              >
                <Users className="w-4 h-4 mr-2" />
                User-wise
              </Button>
              <Button
                onClick={() => setView('controls')}
                size="sm"
                className={view === 'controls' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-transparent text-white/70 hover:text-white'
                }
              >
                <Target className="w-4 h-4 mr-2" />
                Controls
              </Button>
            </div>

            {view === 'realtime' && (
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
                className={autoRefresh 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-white/10 border-white/20 text-white'
                }
              >
                {autoRefresh ? '🟢 Live' : '⏸️ Paused'}
              </Button>
            )}

            <Button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { 
                    method: 'POST', 
                    credentials: 'include' 
                  })
                  // Force redirect to login page
                  window.location.href = '/'
                } catch (error) {
                  console.error('Logout failed:', error)
                  // Force redirect anyway
                  window.location.href = '/'
                }
              }}
              variant="outline"
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* User Selection for User-wise View */}
        {view === 'userwise' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-white font-semibold">Select User:</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-64 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {users.filter(user => !user.isAdmin).map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-white hover:bg-white/10">
                      {user.username} ({user.points} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Controls Panel */}
        {view === 'controls' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* AGAINST Powerups */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">⚡ AGAINST Powerups</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Target User:</label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {users.filter(u => !u.isAdmin).map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-white hover:bg-white/10">
                          {u.username} ({u.points} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-2 block">Powerup:</label>
                  <Select value={selectedPowerup} onValueChange={setSelectedPowerup}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select powerup..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {againstPowerups.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-white hover:bg-white/10">
                          {p.name} (-{p.cost}pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPowerup && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/80 text-sm">
                      {againstPowerups.find(p => p.id === selectedPowerup)?.description}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={triggerPowerup}
                  disabled={!selectedPowerup || !targetUserId}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                >
                  Trigger Powerup
                </Button>
              </div>
            </div>

            {/* Point Management */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">💰 Point Management</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Target User:</label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {users.filter(u => !u.isAdmin).map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-white hover:bg-white/10">
                          {u.username} ({u.points} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <div className="flex bg-white/10 rounded-lg p-1">
                    <Button
                      onClick={() => setPointAction('add')}
                      size="sm"
                      className={pointAction === 'add' 
                        ? 'bg-green-500/30 text-green-400' 
                        : 'bg-transparent text-white/70'
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    <Button
                      onClick={() => setPointAction('subtract')}
                      size="sm"
                      className={pointAction === 'subtract' 
                        ? 'bg-red-500/30 text-red-400' 
                        : 'bg-transparent text-white/70'
                      }
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Subtract
                    </Button>
                  </div>
                  
                  <Input
                    type="number"
                    value={pointAmount}
                    onChange={(e) => setPointAmount(Number(e.target.value))}
                    placeholder="Points"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <Button 
                  onClick={managePoints}
                  disabled={!targetUserId || pointAmount <= 0}
                  className={`w-full ${pointAction === 'add' 
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30'
                  }`}
                >
                  {pointAction === 'add' ? 'Add' : 'Subtract'} {pointAmount} Points
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {view !== 'controls' && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {view === 'realtime' ? '🔴 Live Activity Feed' : `📊 ${selectedUserId ? users.find(u => u.id === selectedUserId)?.username : 'Select User'} Activity`}
            </h3>
            <Button
              onClick={fetchActivity}
              size="sm"
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
            >
              Refresh
            </Button>
          </div>
          
          {activity.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">
                {view === 'userwise' && !selectedUserId 
                  ? 'Select a user to view their activity' 
                  : 'No recent activity'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activity.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-white/5 rounded-2xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getActivityColor(item)} rounded-xl flex items-center justify-center`}>
                        {getActivityIcon(item)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-semibold">{item.username}</h4>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60 text-sm">
                            {item.type === 'lifeline' ? item.name : 
                             item.game === 'dice_roll' ? 'Dice Roll' : 'Slot Machine'}
                          </span>
                        </div>
                        <p className="text-white/40 text-xs">{formatTime(item.timestamp)}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {item.type === 'lifeline' ? (
                        <p className="text-red-400 font-semibold">-{item.points_spent} pts</p>
                      ) : (
                        <div>
                          <p className="text-red-400 text-sm">-{item.points_bet || item.points_spent} pts</p>
                          {item.points_won! > 0 && (
                            <p className="text-green-400 font-semibold">+{item.points_won} pts</p>
                          )}
                          {item.game === 'dice_roll' && (
                            <p className="text-white/60 text-xs">🎲 {item.dice_result}</p>
                          )}
                          {item.outcome && (
                            <p className={`text-xs ${
                              item.outcome === 'win' || item.outcome === 'big_win' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {item.outcome.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        )}
      </div>
    </div>
  )
}
