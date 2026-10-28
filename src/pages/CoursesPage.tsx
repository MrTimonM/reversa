import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Clock, Shield, Loader2, X,
  Check, ExternalLink, BookOpen, RefreshCw,
} from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { toast } from 'sonner'
import { formatUsdc, parseOnchainError, formatAddress } from '@/lib/utils'
import { REVERSA_ADDRESS, REVERSA_ABI, ERC20_ABI, USDC_ADDRESS, ACTIVE_CHAIN_ID, REVERSA_DEPLOYED } from '@/lib/contract'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { TxSteps, type TxStep } from '@/components/TxSteps'

type OnchainCourse = {
  courseId: bigint
  creator: `0x${string}`
  price: bigint
  refundWindow: bigint
  active: boolean
  title: string
  description: string
}

// ─── Load a single course by ID, call onLoaded when data arrives ───────────
function CourseLoader({ courseId, onLoaded }: { courseId: bigint; onLoaded: (c: OnchainCourse) => void }) {
  const { data } = useReadContract({
    address: REVERSA_ADDRESS,
    abi: REVERSA_ABI,
    functionName: 'getCourse',
    args: [courseId],
    chainId: ACTIVE_CHAIN_ID,
  })
  useEffect(() => {
    if (data && data.active) onLoaded(data)
  }, [data, onLoaded])
  return null
}

// ─── Course card ────────────────────────────────────────────────────────────
function CourseCard({ course, onBuy }: { course: OnchainCourse; onBuy: (c: OnchainCourse) => void }) {
  const rwSec = Number(course.refundWindow)
  const refundBadge = rwSec < 60
    ? `${rwSec}s guarantee`
    : rwSec < 3600
      ? `${Math.round(rwSec / 60)}m guarantee`
      : rwSec < 86400
        ? `${Math.round(rwSec / 3600)}h guarantee`
        : `${Math.round(rwSec / 86400)}-day guarantee`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className="h-1.5 bg-gradient-to-r from-blue-700 to-indigo-500" />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-blue-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-slate-400 truncate">{formatAddress(course.creator)}</p>
            <h3 className="font-bold text-[#0f1a2e] leading-tight mt-0.5 text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{course.title}</h3>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">#{String(course.courseId)}</span>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1 line-clamp-3">{course.description || 'No description provided.'}</p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div>
            <p className="text-lg font-bold text-[#0f1a2e] tabular-nums" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatUsdc(course.price)}
            </p>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-0.5">
              <Shield size={10} />
              <span>{refundBadge}</span>
            </div>
          </div>
          <button
            onClick={() => onBuy(course)}
            className="px-4 py-2 bg-[#1e3a8a] text-white text-sm font-semibold rounded-lg hover:bg-[#1e40af] transition-colors"
          >
            Enroll
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Purchase modal ─────────────────────────────────────────────────────────
function PurchaseModal({ course, onClose }: { course: OnchainCourse; onClose: () => void }) {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const [step, setStep] = useState<TxStep>('idle')
  const [error, setError] = useState('')

  const isWrongChain = isConnected && chainId !== ACTIVE_CHAIN_ID
  const contractDeployed = REVERSA_DEPLOYED

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, REVERSA_ADDRESS] : undefined,
    chainId: ACTIVE_CHAIN_ID,
    query: { enabled: !!address && contractDeployed },
  })

  const { writeContract: approveUsdc, data: approveHash, isPending: isApprovePending } = useWriteContract()
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash, chainId: ACTIVE_CHAIN_ID })

  const { writeContract: purchaseCourse, data: purchaseHash, isPending: isPurchasePending } = useWriteContract()
  const { isSuccess: isPurchaseSuccess, isLoading: isPurchaseConfirming } = useWaitForTransactionReceipt({ hash: purchaseHash, chainId: ACTIVE_CHAIN_ID })

  const derivedStep: TxStep = (() => {
    if (step === 'error') return 'error'
    if (isPurchaseSuccess) return 'success'
    if (isPurchaseConfirming || purchaseHash) return 'confirming'
    if (isPurchasePending) return 'signing'
    if (isApprovePending) return 'approving'
    if (isApproveSuccess && step === 'approved') return 'signing'
    return step
  })()

  useEffect(() => {
    if (isApproveSuccess) void refetchAllowance()
  }, [isApproveSuccess, refetchAllowance])

  useEffect(() => {
    if (isApproveSuccess && step === 'approved') {
      purchaseCourse({
        address: REVERSA_ADDRESS, abi: REVERSA_ABI, functionName: 'purchaseCourse',
        args: [course.courseId, course.price, course.refundWindow],
        chainId: ACTIVE_CHAIN_ID,
      }, {
        onError: (err) => { setStep('error'); setError(parseOnchainError(err)) },
      })
    }
  }, [isApproveSuccess, step, course.courseId, course.price, course.refundWindow, purchaseCourse])

  const handlePurchase = () => {
    if (!isConnected) return
    if (isWrongChain) { switchChain({ chainId: ACTIVE_CHAIN_ID }); return }
    if (!contractDeployed) { toast.error('Unable to connect to contract.'); return }
    setError('')
    const needsApproval = (allowance ?? 0n) < course.price
    if (needsApproval) {
      setStep('approving')
      approveUsdc({
        address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'approve',
        args: [REVERSA_ADDRESS, course.price],
        chainId: ACTIVE_CHAIN_ID,
      }, {
        onSuccess: () => setStep('approved'),
        onError: (err) => { setStep('error'); setError(parseOnchainError(err)) },
      })
    } else {
      setStep('signing')
      purchaseCourse({
        address: REVERSA_ADDRESS, abi: REVERSA_ABI, functionName: 'purchaseCourse',
        args: [course.courseId, course.price, course.refundWindow],
        chainId: ACTIVE_CHAIN_ID,
      }, {
        onError: (err) => { setStep('error'); setError(parseOnchainError(err)) },
      })
    }
  }

  const rwSec = Number(course.refundWindow)
  const refundLabel = rwSec < 60
    ? `${rwSec} seconds`
    : rwSec < 3600
      ? `${Math.round(rwSec / 60)} minutes`
      : rwSec < 86400
        ? `${Math.round(rwSec / 3600)} hours`
        : `${Math.round(rwSec / 86400)} days`

  const isProcessing = derivedStep !== 'idle' && derivedStep !== 'error' && derivedStep !== 'success'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,26,46,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <p className="font-bold text-sm text-[#0f1a2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{course.title}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{formatAddress(course.creator)}</p>
          </div>
          {derivedStep !== 'success' && (
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Course price</span>
              <span className="font-bold tabular-nums text-[#0f1a2e]">{formatUsdc(course.price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Payment method</span>
              <span className="font-medium text-[#0f1a2e]">USDC on Arc</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Guarantee period</span>
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                <Shield size={12} />{refundLabel}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Protocol fee</span>
              <span className="text-emerald-600 font-medium">None</span>
            </div>
          </div>

          <div className="flex gap-2.5 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            <Clock size={14} className="flex-shrink-0 mt-0.5" />
            <p>Your USDC enters smart contract escrow. You may request a full refund for any reason within {refundLabel}. Unconditional guarantee — no questions asked.</p>
          </div>

          {!isConnected ? (
            <div className="text-center py-2">
              <p className="text-sm text-slate-500 mb-3">Connect your wallet to purchase</p>
              <ConnectKitButton />
            </div>
          ) : isWrongChain ? (
            <button onClick={() => switchChain({ chainId: ACTIVE_CHAIN_ID })} className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors text-sm">
              Switch to Arc
            </button>
          ) : derivedStep === 'success' ? (
            <div className="space-y-3">
              <TxSteps step={derivedStep} hash={purchaseHash} />
              <button onClick={onClose} className="w-full py-3 bg-[#1e3a8a] text-white font-semibold rounded-xl hover:bg-[#1e40af] transition-colors text-sm flex items-center justify-center gap-2">
                <Check size={16} /> Go to My Dashboard
              </button>
              {purchaseHash && (
                <a href={buildTxExplorerUrl(ACTIVE_CHAIN_ID, purchaseHash)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-700">
                  View on Arc Explorer <ExternalLink size={10} />
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {derivedStep !== 'idle' && <TxSteps step={derivedStep} hash={purchaseHash} error={error} />}
              <button
                onClick={handlePurchase}
                disabled={isProcessing || isApprovePending || isPurchasePending}
                className="w-full py-3 bg-[#1e3a8a] text-white font-semibold rounded-xl hover:bg-[#1e40af] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isProcessing || isApprovePending || isPurchasePending
                  ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  : <>Purchase for {formatUsdc(course.price)}</>
                }
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export function CoursesPage() {
  const [courses, setCourses] = useState<OnchainCourse[]>([])
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<OnchainCourse | null>(null)

  // How many courses exist onchain
  const { data: nextCourseId, isLoading: isCountLoading, refetch } = useReadContract({
    address: REVERSA_ADDRESS,
    abi: REVERSA_ABI,
    functionName: 'nextCourseId',
    chainId: ACTIVE_CHAIN_ID,
    query: { enabled: REVERSA_DEPLOYED },
  })

  const totalCourses = Number(nextCourseId ?? 0n)

  // Build array of IDs to load: [1n, 2n, ... totalCourses]
  const courseIds: bigint[] = Array.from({ length: totalCourses }, (_, i) => BigInt(i + 1))

  const handleLoaded = (c: OnchainCourse) => {
    setCourses(prev => {
      const exists = prev.find(x => x.courseId === c.courseId)
      if (exists) return prev.map(x => x.courseId === c.courseId ? c : x)
      return [...prev, c].sort((a, b) => Number(b.courseId - a.courseId))
    })
  }

  const filtered = courses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.creator.toLowerCase().includes(search.toLowerCase())
  )

  const isEmpty = !isCountLoading && totalCourses === 0
  const isLoading = isCountLoading || (totalCourses > 0 && courses.length < totalCourses)

  return (
    <div className="min-h-dvh pt-20 pb-16 bg-[#f8f9fb]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl font-bold text-[#0f1a2e] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            Course Marketplace
          </h1>
          <p className="text-slate-500 text-sm">Every course comes with a smart contract money-back guarantee.</p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses or creator address..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={() => { setCourses([]); void refetch() }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter size={13} />
              {isLoading ? 'Loading...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} onchain`}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden loaders — one per course ID */}
      {courseIds.map(id => (
        <CourseLoader key={String(id)} courseId={id} onLoaded={handleLoaded} />
      ))}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isCountLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 size={28} className="animate-spin text-blue-300" />
            <p className="text-sm">Loading courses from the contract...</p>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
            <BookOpen size={36} className="mx-auto text-slate-200 mb-4" />
            <h2 className="text-lg font-bold text-[#0f1a2e] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>No courses yet</h2>
            <p className="text-slate-400 text-sm mb-5">Be the first to list a course with a smart contract guarantee.</p>
            <a
              href="/creator"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a8a] text-white text-sm font-semibold rounded-xl hover:bg-[#1e40af] transition-colors"
            >
              Create a Course
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Search size={32} className="mx-auto mb-3 opacity-40" />
            <p>No courses match your search.</p>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                <Loader2 size={12} className="animate-spin" /> Loading more courses...
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(course => (
                <CourseCard key={String(course.courseId)} course={course} onBuy={setSelectedCourse} />
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedCourse && (
          <PurchaseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
