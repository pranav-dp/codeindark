import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/error-boundary'
import { ToastProvider } from '@/components/ui/toast'
import SabotageNotificationWrapper from '@/components/sabotage-notification-wrapper'
import './globals.css'

export const metadata: Metadata = {
  title: 'CodeDark - Gaming Platform',
  description: 'Play games, earn points, and compete with friends!',
  keywords: 'gaming, points, leaderboard, slots, dice, lifelines',
  authors: [{ name: 'CodeDark Team' }],
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <SabotageNotificationWrapper />
              {children}
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
