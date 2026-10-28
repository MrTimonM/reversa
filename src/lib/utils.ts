import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatUsdc(raw: bigint, decimals = 6): string {
  const value = Number(raw) / Math.pow(10, decimals)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('user denied') || msg.includes('action_rejected')) {
    return 'Transaction cancelled.'
  }
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) {
    return 'Insufficient USDC balance. Please add funds and try again.'
  }
  if (msg.includes('not the student')) return 'Only the original student can request a refund.'
  if (msg.includes('not protected')) return 'This purchase is not eligible for a refund.'
  if (msg.includes('refund window expired')) return 'The refund window has already expired.'
  if (msg.includes('refund window active')) return 'The refund window has not expired yet.'
  if (msg.includes('not the creator')) return 'Only the course creator can release this payment.'
  if (msg.includes('price changed')) return 'Course price changed before your purchase was processed. Please try again.'
  if (msg.includes('refund window changed')) return 'Course refund terms changed before your purchase was processed. Please try again.'
  if (msg.includes('course does not exist')) return 'This course does not exist on the contract yet. It may be a sample course for display only.'
  if (msg.includes('course not active')) return 'This course is no longer active.'
  if (msg.includes('reverted')) {
    const match = msg.match(/reason="([^"]+)"/)
    return match ? `Transaction failed: ${match[1]}` : 'Transaction failed. Please try again.'
  }
  if (msg.includes('network') || msg.includes('timeout')) {
    return 'Network error. Please check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export function countdown(deadline: number): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const now = Math.floor(Date.now() / 1000)
  const remaining = deadline - now
  if (remaining <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60
  return { days, hours, minutes, seconds, expired: false }
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
