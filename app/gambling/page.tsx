'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Coins, Dices } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GamblingPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [userPoints, setUserPoints] = useState(0)
  
  // Slot machine state
  const [slotSpinning, setSlotSpinning] = useState(false)
  const [slotResult, setSlotResult] = useState(['🍒', '🍒', '🍒'])
  const [slotMessage, setSlotMessage] = useState('')
  
  // Dice state
  const [diceRolling, setDiceRolling] = useState(false)
  const [diceResult, setDiceResult] = useState(1)
  const [betAmount, setBetAmount] = useState(10)
  const [diceMessage, setDiceMessage] = useState('')

  useEffect(() => {
    // Only redirect after loading is complete
    if (loading) return
    
    if (!user) {
      router.push('/')
    } else {
      setUserPoints(user.points)
    }
  }, [user, loading, router])

  const playSlots = async () => {
    if (userPoints < 10) {
      alert('You need at least 10 points to play!')
      return
    }

    setSlotSpinning(true)
    setSlotMessage('')
    
    // Animate spinning
    const spinDuration = 2000
    const spinInterval = setInterval(() => {
      setSlotResult([
        ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'][Math.floor(Math.random() * 6)],
        ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'][Math.floor(Math.random() * 6)],
        ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'][Math.floor(Math.random() * 6)]
      ])
    }, 100)

    setTimeout(async () => {
      clearInterval(spinInterval)
      
      try {
        const response = await fetch('/api/gambling/slot', {
          method: 'POST',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          setSlotResult(data.result)
          setSlotMessage(data.message)
          setUserPoints(data.newPoints)
          await refreshUser()
        } else {
          const errorData = await response.json()
          alert(errorData.error)
        }
      } catch (error) {
        console.error('Slot machine error:', error)
        alert('Failed to play slots')
      } finally {
        setSlotSpinning(false)
      }
    }, spinDuration)
  }

  const rollDice = async () => {
    if (userPoints < betAmount) {
      alert('Insufficient points!')
      return
    }

    if (betAmount <= 0) {
      alert('Please enter a valid bet amount!')
      return
    }

    setDiceRolling(true)
    setDiceMessage('')
    
    // Animate rolling
    const rollDuration = 1500
    const rollInterval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1)
    }, 100)

    setTimeout(async () => {
      clearInterval(rollInterval)
      
      try {
        const response = await fetch('/api/gambling/dice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ betAmount })
        })

        if (response.ok) {
          const data = await response.json()
          setDiceResult(data.diceResult)
          setDiceMessage(data.message)
          setUserPoints(data.newPoints)
          await refreshUser()
        } else {
          const errorData = await response.json()
          alert(errorData.error)
        }
      } catch (error) {
        console.error('Dice roll error:', error)
        alert('Failed to roll dice')
      } finally {
        setDiceRolling(false)
      }
    }, rollDuration)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-bold text-white">🎰 Gambling Zone</h1>
              <p className="text-white/70">Try your luck and win big!</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3">
            <div className="text-center">
              <p className="text-white/80 text-sm">Your Points</p>
              <p className="text-2xl font-bold text-white">{userPoints}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Slot Machine */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">🎰 Slot Machine</h2>
              <p className="text-white/70">10 points per spin</p>
            </div>

            {/* Slot Display */}
            <div className="bg-black/30 rounded-2xl p-6 mb-6">
              <div className="flex justify-center space-x-4 mb-4">
                {slotResult.map((symbol, index) => (
                  <motion.div
                    key={index}
                    className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center text-4xl"
                    animate={slotSpinning ? { rotateY: 360 } : {}}
                    transition={{ duration: 0.1, repeat: slotSpinning ? Infinity : 0 }}
                  >
                    {symbol}
                  </motion.div>
                ))}
              </div>
              
              <AnimatePresence>
                {slotMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center text-white font-semibold"
                  >
                    {slotMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={playSlots}
              disabled={slotSpinning || userPoints < 10}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg"
            >
              {slotSpinning ? 'Spinning...' : 'SPIN (10 points)'}
            </Button>

            {/* Payout Table */}
            <div className="mt-6 text-xs text-white/60">
              <p className="font-semibold mb-2">Payouts:</p>
              <div className="grid grid-cols-2 gap-1">
                <span>💎💎💎: 500pts</span>
                <span>⭐⭐⭐: 200pts</span>
                <span>🍒🍒🍒: 100pts</span>
                <span>🍇🍇🍇: 80pts</span>
                <span>💎💎: 50pts</span>
                <span>⭐⭐: 30pts</span>
              </div>
            </div>
          </div>

          {/* Dice Game */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">🎲 Dice Roll</h2>
              <p className="text-white/70">Bet your points for multipliers!</p>
            </div>

            {/* Dice Display */}
            <div className="bg-black/30 rounded-2xl p-6 mb-6 text-center">
              <motion.div
                className="w-24 h-24 bg-white rounded-xl flex items-center justify-center text-4xl font-bold mx-auto mb-4"
                animate={diceRolling ? { rotateX: 360, rotateY: 360 } : {}}
                transition={{ duration: 0.2, repeat: diceRolling ? Infinity : 0 }}
              >
                {diceResult}
              </motion.div>
              
              <AnimatePresence>
                {diceMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-white font-semibold"
                  >
                    {diceMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bet Input */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">Bet Amount:</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={userPoints}
                className="bg-white/10 border-white/20 text-white"
                disabled={diceRolling}
              />
            </div>

            <Button
              onClick={rollDice}
              disabled={diceRolling || userPoints < betAmount}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg"
            >
              {diceRolling ? 'Rolling...' : `ROLL (${betAmount} points)`}
            </Button>

            {/* Multiplier Table */}
            <div className="mt-6 text-xs text-white/60">
              <p className="font-semibold mb-2">Multipliers:</p>
              <div className="grid grid-cols-2 gap-1">
                <span>🎲 6: 3x win</span>
                <span>🎲 5: 2x win</span>
                <span>🎲 4: 1.2x win</span>
                <span>🎲 3: 0.8x back</span>
                <span>🎲 2: 0.5x back</span>
                <span>🎲 1: Lose all</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
