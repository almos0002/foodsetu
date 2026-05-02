import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-coral)] text-white hover:bg-[var(--color-coral-2)] disabled:bg-[var(--color-line)] disabled:text-[var(--color-ink-3)] border-[1.5px] border-transparent',
  secondary:
    'bg-[var(--color-cream)] text-[var(--color-ink)] hover:bg-[var(--color-cream-2)] border-[1.5px] border-transparent disabled:bg-[var(--color-cream)] disabled:text-[var(--color-ink-3)]',
  outline:
    'border-[1.5px] border-[var(--color-line-strong)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-cream)] disabled:bg-white disabled:text-[var(--color-ink-3)] disabled:border-[var(--color-line)]',
  ghost:
    'border-[1.5px] border-transparent bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-cream)] disabled:text-[var(--color-ink-3)]',
  destructive:
    'border-[1.5px] border-transparent bg-[var(--color-coral)] text-white hover:bg-[var(--color-coral-2)] disabled:bg-[var(--color-line)] disabled:text-[var(--color-ink-3)]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-4 text-sm gap-1.5',
  lg: 'h-12 px-5 text-sm gap-2',
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
        'inline-flex items-center justify-center rounded-full font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed',
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
