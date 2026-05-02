import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 border border-transparent',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-transparent disabled:bg-gray-100 disabled:text-gray-400',
  outline:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400',
  ghost:
    'border border-transparent bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400',
  destructive:
    'border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:border-gray-200 disabled:bg-white disabled:text-gray-400',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3 text-sm gap-1.5',
  lg: 'h-10 px-4 text-sm gap-2',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
