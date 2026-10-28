import { motion } from 'framer-motion'
import { Check, Loader2, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { ACTIVE_CHAIN_ID } from '@/lib/contract'

export type TxStep = 'idle' | 'approving' | 'approved' | 'signing' | 'confirming' | 'success' | 'error'
// 'approved' is an internal transition state — TxSteps renders it as 'signing'

interface TxStepsProps {
  step: TxStep
  hash?: `0x${string}`
  error?: string
  className?: string
  labels?: {
    approving?: string
    signing?: string
    confirming?: string
    success?: string
  }
}

const defaultLabels = {
  approving: 'Approving USDC spend...',
  signing: 'Confirm in your wallet',
  confirming: 'Waiting for confirmation...',
  success: 'Transaction confirmed!',
}

export function TxSteps({ step, hash, error, className, labels }: TxStepsProps) {
  if (step === 'idle') return null
  const l = { ...defaultLabels, ...labels }

  const steps: Array<{ key: string; label: string; active: boolean; done: boolean }> = [
    { key: 'approving', label: l.approving, active: step === 'approving', done: ['approved', 'signing', 'confirming', 'success'].includes(step) },
    { key: 'signing', label: l.signing, active: step === 'signing', done: ['confirming', 'success'].includes(step) },
    { key: 'confirming', label: l.confirming, active: step === 'confirming', done: step === 'success' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-slate-100 bg-slate-50 p-4', className)}
    >
      {step === 'error' ? (
        <div className="flex items-start gap-3 text-red-600">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <X size={12} />
          </div>
          <div>
            <p className="font-medium text-sm">Transaction failed</p>
            {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
          </div>
        </div>
      ) : step === 'success' ? (
        <div className="flex items-start gap-3 text-emerald-700">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check size={12} />
          </div>
          <div>
            <p className="font-medium text-sm">{l.success}</p>
            {hash && (
              <a
                href={buildTxExplorerUrl(ACTIVE_CHAIN_ID, hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                View on Arc Explorer <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.key} className={cn('flex items-center gap-3 text-sm', !s.active && !s.done && 'opacity-40')}>
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                s.done ? 'bg-emerald-100 text-emerald-700' : s.active ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400',
              )}>
                {s.done ? <Check size={10} /> : s.active ? <Loader2 size={10} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              </div>
              <span className={cn(s.active ? 'text-slate-800 font-medium' : s.done ? 'text-slate-500 line-through' : 'text-slate-400')}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
