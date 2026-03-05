import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-purple-blue text-white shadow-colorful hover:scale-105 hover:shadow-neon active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-heavy hover:bg-destructive/90 hover:scale-105 active:scale-95",
        outline:
          "border-2 border-gold bg-background shadow-lg hover:bg-gradient-gold hover:text-gold-foreground hover:scale-105 active:scale-95",
        secondary:
          "bg-gradient-pink-orange text-white shadow-colorful hover:scale-105 hover:shadow-neon active:scale-95",
        ghost: "hover:bg-card-purple hover:text-primary hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline hover:text-gradient-purple",
        success:
          "bg-gradient-green-yellow text-white shadow-colorful hover:scale-105 hover:shadow-neon active:scale-95",
        gold:
          "bg-gradient-gold text-gold-foreground shadow-gold hover:scale-105 hover:shadow-heavy active:scale-95",
        rainbow:
          "bg-gradient-rainbow text-white shadow-neon hover:scale-105 hover:shadow-heavy active:scale-95 animate-glow",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-11 w-11",
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
