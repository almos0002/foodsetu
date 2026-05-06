import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'accent'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-hover)] disabled:bg-[var(--color-line-strong)] disabled:text-white border border-transparent',
  accent:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-2)] disabled:bg-[var(--color-line-strong)] disabled:text-white border border-transparent',
  secondary:
    'bg-[var(--color-canvas-2)] text-[var(--color-ink)] hover:bg-[var(--color-canvas-3)] border border-[var(--color-line)] disabled:text-[var(--color-ink-3)]',
  outline:
    'border border-[var(--color-line-strong)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:bg-[var(--color-canvas-2)] disabled:text-[var(--color-ink-3)] disabled:border-[var(--color-line)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-canvas-2)] disabled:text-[var(--color-ink-3)]',
  destructive:
    'border border-transparent bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-ink)] disabled:bg-[var(--color-line-strong)] disabled:text-white',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 squircle',
  md: 'h-10 px-4 text-sm gap-2 squircle',
  lg: 'h-11 px-5 text-sm gap-2 squircle',
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
        'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed',
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
