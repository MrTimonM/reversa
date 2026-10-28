import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
  textClass?: string
}

export function Logo({ className, size = 32, showText = true, textClass }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield base */}
        <path
          d="M20 3L5 9.5V20.5C5 28.5 11.5 35.5 20 38C28.5 35.5 35 28.5 35 20.5V9.5L20 3Z"
          fill="url(#shield-gradient)"
        />
        {/* Circular arrow — payment flow */}
        <path
          d="M26 20C26 23.31 23.31 26 20 26C17.18 26 14.78 24.16 13.8 21.6"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M14 14C14 10.69 16.69 8 20 8C22.82 8 25.22 9.84 26.2 12.4"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Arrow heads */}
        <path d="M11.5 20.5L13.8 21.6L13 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28.5 13.5L26.2 12.4L27 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="shield-gradient" x1="5" y1="3" x2="35" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e40af" />
            <stop offset="1" stopColor="#0891b2" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={cn('font-display font-700 tracking-tight text-[#0f1a2e]', textClass)}
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
          Reversa
        </span>
      )}
    </div>
  )
}
