'use client'

import { useAuth } from '@/contexts/AuthContext'
import SabotageNotificationComponent from './sabotage-notification'

export default function SabotageNotificationWrapper() {
  const { user, loading } = useAuth()

  // Only show notifications if user is authenticated and not loading
  if (loading || !user) {
    return null
  }

  return <SabotageNotificationComponent userId={user.id} />
}
