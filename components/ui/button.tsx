import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Enhanced purple variants with glow effects
        purple: "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300",
        "purple-glow": "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 border border-purple-500/30 transition-all duration-300",
        "purple-outline": "border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-400 transition-all duration-300",
        "purple-ghost": "text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-all duration-300",
        // Dark variants
        dark: "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 transition-all duration-300",
        "dark-glow": "bg-gray-800 text-white hover:bg-gray-700 border border-gray-600 shadow-lg shadow-gray-500/20 hover:shadow-gray-500/30 transition-all duration-300",
        // Legacy gradient variants (enhanced)
        gradient: "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300",
        "gradient-yellow": "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300",
        "gradient-blue": "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300",
        // Glass variant (updated for dark theme)
        glass: "bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 text-white hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
