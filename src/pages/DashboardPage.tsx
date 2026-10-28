import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Shield, RefreshCcw, TrendingUp, ExternalLink, Loader2, AlertCircle, BookOpen } from 'lucide-react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { toast } from 'sonner'
import { cn, formatUsdc, formatDate, countdown, parseOnchainError, formatAddress } from '@/lib/utils'
import { REVERSA_ADDRESS, REVERSA_ABI, ACTIVE_CHAIN_ID, PurchaseStatus, REVERSA_DEPLOYED } from '@/lib/contract'

import { TxSteps, type TxStep } from '@/components/TxSteps'

type Purchase = {
  purchaseId: bigint
  courseId: bigint
  student: `0x${string}`
  creator: `0x${string}`
  amount: bigint
  refundWindow: bigint
  purchasedAt: bigint
  refundDeadline: bigint
  status: number
}

function StatusBadge({ status, deadline, nowSec }: { status: number; deadline: bigint; nowSec: number }) {
  const now = BigInt(nowSec)
  if (status === PurchaseStatus.Refunded) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">Refunded</span>
  }
  if (status === PurchaseStatus.Released) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">Released</span>
  }
  const expired = now > deadline
  return expired
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold"><AlertCircle size={9} />Window Closed</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold"><Shield size={9} />Protected</span>
}

function CountdownChip({ deadline }: { deadline: bigint }) {
  const [cd, setCd] = useState(countdown(Number(deadline)))
  useEffect(() => {
    const id = setInterval(() => setCd(countdown(Number(deadline))), 1000)
    return () => clearInterval(id)
  }, [deadline])
  if (cd.expired) return <span className="text-xs text-amber-600 font-medium">Expired</span>
  return (
    <span className="text-xs font-mono text-emerald-700 tabular-nums">
      {cd.days > 0 ? `${cd.days}d ` : ''}{String(cd.hours).padStart(2, '0')}h {String(cd.minutes).padStart(2, '0')}m {String(cd.seconds).padStart(2, '0')}s left
    </span>
  )
}

function getNowSec() { return Math.floor(Date.now() / 1000) }

function PurchaseRow({ purchase, onRefund }: { purchase: Purchase; onRefund: (id: bigint) => void }) {
  const [nowSec, setNowSec] = useState(getNowSec)
  // Keep nowSec fresh — interval is an external system, qualifying for setState-in-effect
  useEffect(() => {
    const id = setInterval(() => { setNowSec(getNowSec()) }, 5000)
    return () => clearInterval(id)
  }, [setNowSec])
  const now = BigInt(nowSec)
  const canRefund = purchase.status === PurchaseStatus.Protected && now <= purchase.refundDeadline

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[#0f1a2e] text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Course #{String(purchase.courseId)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{formatAddress(purchase.creator)}</p>
        </div>
        <StatusBadge status={purchase.status} deadline={purchase.refundDeadline} nowSec={nowSec} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-400 mb-0.5">Amount</p>
          <p className="font-bold tabular-nums text-[#0f1a2e]">{formatUsdc(purchase.amount)}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">Purchased</p>
          <p className="font-medium text-slate-700">{formatDate(Number(purchase.purchasedAt))}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">Refund deadline</p>
          <p className="font-medium text-slate-700">{formatDate(Number(purchase.refundDeadline))}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">Time remaining</p>
          <CountdownChip deadline={purchase.refundDeadline} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <a
          href={`https://explorer.arc.io/address/${REVERSA_ADDRESS}?tab=contract_events`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          Purchase #{String(purchase.purchaseId)} <ExternalLink size={10} />
        </a>
        {canRefund && (
          <button
            onClick={() => onRefund(purchase.purchaseId)}
            className="px-3 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCcw size={11} /> Request Refund
          </button>
        )}
        {purchase.status === PurchaseStatus.Protected && BigInt(nowSec) > purchase.refundDeadline && (
          <span className="text-xs text-slate-400">Refund period ended</span>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', accent)}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-[#0f1a2e] tabular-nums mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}

function PurchaseLoader({ purchaseId, onLoaded }: { purchaseId: bigint; onLoaded: (p: Purchase) => void }) {
  const { data } = useReadContract({
    address: REVERSA_ADDRESS,
    abi: REVERSA_ABI,
    functionName: 'getPurchase',
    args: [purchaseId],
    chainId: ACTIVE_CHAIN_ID,
  })
  useEffect(() => {
    if (data) onLoaded(data)
  }, [data, onLoaded])
  return null
}

export function DashboardPage() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [refundStep, setRefundStep] = useState<TxStep>('idle')
  const [refundError, setRefundError] = useState('')
  const [refundingId, setRefundingId] = useState<bigint | null>(null)

  const contractDeployed = REVERSA_DEPLOYED
  const isWrongChain = isConnected && chainId !== ACTIVE_CHAIN_ID

  const { data: purchaseIds } = useReadContract({
    address: REVERSA_ADDRESS,
    abi: REVERSA_ABI,
    functionName: 'getStudentPurchaseIds',
    args: address ? [address] : undefined,
    chainId: ACTIVE_CHAIN_ID,
    query: { enabled: !!address && contractDeployed },
  })

  const handleLoaded = (p: Purchase) => {
    setPurchases((prev) => {
      const exists = prev.find((x) => x.purchaseId === p.purchaseId)
      if (exists) return prev.map((x) => x.purchaseId === p.purchaseId ? p : x)
      return [...prev, p].sort((a, b) => Number(b.purchasedAt - a.purchasedAt))
    })
  }

  const { writeContract: refundContract, data: refundTxHash, isPending: isRefundPending } = useWriteContract()
  const { isSuccess: isRefundSuccess, isLoading: isRefundConfirming } = useWaitForTransactionReceipt({
    hash: refundTxHash,
    chainId: ACTIVE_CHAIN_ID,
  })

  // Derive step from wagmi state — avoids setState-in-effect
  const derivedRefundStep: TxStep = (() => {
    if (refundStep === 'error') return 'error'
    if (isRefundSuccess) return 'success'
    if (isRefundConfirming) return 'confirming'
    if (refundTxHash) return 'confirming'   // hash landed, waiting for receipt
    if (isRefundPending) return 'signing'
    return refundStep
  })()

  const refundNotifiedRef = useRef(false)
  useEffect(() => {
    if (isRefundSuccess && refundTxHash && !refundNotifiedRef.current) {
      refundNotifiedRef.current = true
      toast.success('Refund issued successfully!')
      setTimeout(() => window.location.reload(), 3000)
    }
  }, [isRefundSuccess, refundTxHash])

  const handleRefund = (purchaseId: bigint) => {
    if (isWrongChain) { switchChain({ chainId: ACTIVE_CHAIN_ID }); return }
    setRefundingId(purchaseId)
    setRefundStep('signing')
    setRefundError('')
    refundContract({
      address: REVERSA_ADDRESS,
      abi: REVERSA_ABI,
      functionName: 'requestRefund',
      args: [purchaseId],
      chainId: ACTIVE_CHAIN_ID,
    }, {
      onSuccess: () => setRefundingId(null),
      onError: (err) => {
        setRefundStep('error')
        setRefundError(parseOnchainError(err))
        setRefundingId(null)
      },
    })
  }

  // Stats
  const totalProtected = purchases.filter(p => p.status === PurchaseStatus.Protected).reduce((s, p) => s + p.amount, 0n)
  const totalRefunded = purchases.filter(p => p.status === PurchaseStatus.Refunded).reduce((s, p) => s + p.amount, 0n)
  const [nowSecGlobal] = useState(() => Math.floor(Date.now() / 1000))
  const activeGuarantees = purchases.filter(p => {
    return p.status === PurchaseStatus.Protected && BigInt(nowSecGlobal) <= p.refundDeadline
  }).length

  if (!isConnected) {
    return (
      <div className="min-h-dvh pt-24 flex flex-col items-center justify-center bg-[#f8f9fb] px-4">
        <Shield size={40} className="text-blue-200 mb-4" />
        <h2 className="text-xl font-bold text-[#0f1a2e] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Connect to view your dashboard</h2>
        <p className="text-slate-400 text-sm mb-6">Your courses and guarantees are linked to your wallet address.</p>
        <ConnectKitButton />
      </div>
    )
  }

  return (
    <div className="min-h-dvh pt-20 pb-16 bg-[#f8f9fb]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold text-[#0f1a2e] mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            My Dashboard
          </h1>
          <p className="text-sm text-slate-400 font-mono">{address}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Total Purchased" value={String((purchaseIds as bigint[] | undefined)?.length ?? 0)} accent="bg-blue-700" />
          <StatCard icon={Shield} label="Protected USDC" value={formatUsdc(totalProtected)} accent="bg-emerald-600" />
          <StatCard icon={RefreshCcw} label="Total Refunded" value={formatUsdc(totalRefunded)} accent="bg-sky-600" />
          <StatCard icon={TrendingUp} label="Active Guarantees" value={String(activeGuarantees)} accent="bg-violet-700" />
        </motion.div>

        {/* Refund status */}
        {derivedRefundStep !== 'idle' && (
          <TxSteps step={derivedRefundStep} hash={refundTxHash} error={refundError} labels={{ signing: 'Confirm refund in wallet', success: 'Refund issued!' }} />
        )}

        {/* Purchases */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Purchase History</h2>
          {!contractDeployed ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-700 flex items-start gap-3">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Contract not connected</p>
                <p>Unable to reach the Reversa contract. Please check your connection and reload.</p>
              </div>
            </div>
          ) : (purchaseIds as bigint[] | undefined)?.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <BookOpen size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 text-sm">No courses purchased yet.</p>
              <a href="/courses" className="inline-block mt-3 text-blue-600 text-sm font-medium hover:text-blue-700">Browse courses →</a>
            </div>
          ) : (
            <div className="space-y-4">
              {(purchaseIds as bigint[] | undefined)?.map((id) => (
                <div key={String(id)}>
                  <PurchaseLoader purchaseId={id} onLoaded={handleLoaded} />
                </div>
              ))}
              {purchases.map((p) => (
                <motion.div key={String(p.purchaseId)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <PurchaseRow
                    purchase={p}
                    onRefund={handleRefund}
                  />
                  {refundingId === p.purchaseId && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                      <Loader2 size={12} className="animate-spin" />
                      {isRefundPending ? 'Waiting for wallet approval...' : isRefundConfirming ? 'Confirming...' : ''}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


