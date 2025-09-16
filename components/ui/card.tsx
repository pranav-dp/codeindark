import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border text-card-foreground shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        // Dark theme variants
        dark: "bg-gray-900/80 border-gray-800",
        "dark-subtle": "bg-gray-900/50 border-gray-800/50",
        "dark-glow": "bg-gray-900/80 border-purple-500/20 shadow-lg shadow-purple-500/10",
        // Purple glow variants
        "purple-glow": "bg-gray-900/90 border-purple-500/30 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:border-purple-500/40",
        "purple-glow-lg": "bg-gray-900/95 border-purple-500/40 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:border-purple-500/60",
        // Stats and special cards
        stats: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/20 shadow-lg shadow-purple-500/15",
        "stats-glow": "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/30 shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40",
        // Interactive cards
        interactive: "bg-gray-900/80 border-gray-700 hover:bg-gray-800/80 hover:border-purple-500/30 cursor-pointer",
        "interactive-glow": "bg-gray-900/80 border-gray-700 hover:bg-gray-800/80 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer",
        // Legacy glass variants (updated for dark theme)
        glass: "bg-gray-900/60 backdrop-blur-xl border-gray-700/50",
        "glass-rounded": "bg-gray-900/60 backdrop-blur-xl rounded-2xl border-gray-700/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-gray-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
