import { useState, useEffect, useRef } from 'react'
import { PlusCircle, Loader2, AlertCircle, DollarSign, BookOpen, RefreshCcw, Zap, ExternalLink, Check } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { toast } from 'sonner'
import { cn, formatUsdc, formatDate, parseOnchainError } from '@/lib/utils'
import { REVERSA_ADDRESS, REVERSA_ABI, ACTIVE_CHAIN_ID, PurchaseStatus, REVERSA_DEPLOYED } from '@/lib/contract'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { TxSteps, type TxStep } from '@/components/TxSteps'

type Course = { courseId: bigint; creator: `0x${string}`; price: bigint; refundWindow: bigint; active: boolean; title: string; description: string }
type Purchase = { purchaseId: bigint; courseId: bigint; student: `0x${string}`; creator: `0x${string}`; amount: bigint; refundWindow: bigint; purchasedAt: bigint; refundDeadline: bigint; status: number }

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

function CourseLoader({ courseId, onLoaded }: { courseId: bigint; onLoaded: (c: Course) => void }) {
  const { data } = useReadContract({ address: REVERSA_ADDRESS, abi: REVERSA_ABI, functionName: 'getCourse', args: [courseId], chainId: ACTIVE_CHAIN_ID })
  useEffect(() => { if (data) onLoaded(data) }, [data, onLoaded])
  return null
}

function PurchaseLoader({ purchaseId, onLoaded }: { purchaseId: bigint; onLoaded: (p: Purchase) => void }) {
  const { data } = useReadContract({ address: REVERSA_ADDRESS, abi: REVERSA_ABI, functionName: 'getPurchase', args: [purchaseId], chainId: ACTIVE_CHAIN_ID })
  useEffect(() => { if (data) onLoaded(data) }, [data, onLoaded])
  return null
}

function CourseCard({ course, purchases }: { course: Course; purchases: Purchase[] }) {
  const coursePurchases = purchases.filter(p => p.courseId === course.courseId)
  const revenue = coursePurchases.filter(p => p.status === PurchaseStatus.Released).reduce((s, p) => s + p.amount, 0n)
  const protected_ = coursePurchases.filter(p => p.status === PurchaseStatus.Protected).reduce((s, p) => s + p.amount, 0n)
  const refunded = coursePurchases.filter(p => p.status === PurchaseStatus.Refunded).reduce((s, p) => s + p.amount, 0n)
  const windowSec = Number(course.refundWindow)
  const refundLabel = windowSec < 60
    ? `${windowSec}s refund`
    : windowSec < 3600
      ? `${Math.round(windowSec / 60)}m refund`
      : windowSec < 86400
        ? `${Math.round(windowSec / 3600)}h refund`
        : `${Math.round(windowSec / 86400)}d refund`

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('w-2 h-2 rounded-full', course.active ? 'bg-emerald-500' : 'bg-slate-300')} />
            <span className="text-xs text-slate-500">{course.active ? 'Active' : 'Inactive'}</span>
            {windowSec <= 60 && <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-medium">Demo</span>}
          </div>
          <h3 className="font-bold text-[#0f1a2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{course.title}</h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold tabular-nums text-[#0f1a2e]">{formatUsdc(course.price)}</p>
          <p className="text-xs text-slate-400">{refundLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50 text-xs">
        <div>
          <p className="text-slate-400 mb-1">Purchases</p>
          <p className="font-bold text-[#0f1a2e]">{coursePurchases.length}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-1">Protected</p>
          <p className="font-bold text-emerald-700 tabular-nums">{formatUsdc(protected_)}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-1">Released</p>
          <p className="font-bold text-blue-700 tabular-nums">{formatUsdc(revenue)}</p>
        </div>
      </div>
      {refunded > 0n && <p className="text-xs text-slate-400 mt-2">Refunded: {formatUsdc(refunded)}</p>}
    </div>
  )
}

function PurchaseRow({ purchase, onRelease, nowSec }: { purchase: Purchase; onRelease: (id: bigint) => void; nowSec: number }) {
  const now = BigInt(nowSec)
  const canRelease = purchase.status === PurchaseStatus.Protected && now > purchase.refundDeadline

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[#0f1a2e]">Purchase #{String(purchase.purchaseId)}</p>
          {purchase.status === PurchaseStatus.Protected && now <= purchase.refundDeadline && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-medium">Protected</span>
          )}
          {purchase.status === PurchaseStatus.Released && (
            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">Released</span>
          )}
          {purchase.status === PurchaseStatus.Refunded && (
            <span className="text-xs bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-md font-medium">Refunded</span>
          )}
          {canRelease && <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-medium">Eligible</span>}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{formatDate(Number(purchase.purchasedAt))} · Course #{String(purchase.courseId)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold tabular-nums text-sm">{formatUsdc(purchase.amount)}</p>
        {canRelease && (
          <button
            onClick={() => onRelease(purchase.purchaseId)}
            className="mt-1 px-2.5 py-1 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            Release
          </button>
        )}
      </div>
    </div>
  )
}

export function CreatorPage() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [courses, setCourses] = useState<Course[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [createStep, setCreateStep] = useState<TxStep>('idle')
  const [createError, setCreateError] = useState('')
  const [releaseStep, setReleaseStep] = useState<TxStep>('idle')
  const [releaseError, setReleaseError] = useState('')
  const createNotifiedRef = useRef(false)
  const releaseNotifiedRef = useRef(false)

  // refundValue + refundUnit → raw seconds on submit
  const [form, setForm] = useState({ title: '', description: '', price: '', refundValue: '7', refundUnit: 'days' as 'seconds' | 'minutes' | 'hours' | 'days' })

  const contractDeployed = REVERSA_DEPLOYED
  const isWrongChain = isConnected && chainId !== ACTIVE_CHAIN_ID

  const { data: courseIds } = useReadContract({ address: REVERSA_ADDRESS, abi: REVERSA_ABI, functionName: 'getCreatorCourseIds', args: address ? [address] : undefined, chainId: ACTIVE_CHAIN_ID, query: { enabled: !!address && contractDeployed } })
  const { data: purchaseIds } = useReadContract({ address: REVERSA_ADDRESS, abi: REVERSA_ABI, functionName: 'getCreatorPurchaseIds', args: address ? [address] : undefined, chainId: ACTIVE_CHAIN_ID, query: { enabled: !!address && contractDeployed } })

  const handleCourseLoaded = (c: Course) => setCourses(prev => { const exists = prev.find(x => x.courseId === c.courseId); if (exists) return prev; return [...prev, c] })
  const handlePurchaseLoaded = (p: Purchase) => setPurchases(prev => { const exists = prev.find(x => x.purchaseId === p.purchaseId); if (exists) return prev; return [...prev, p].sort((a, b) => Number(b.purchasedAt - a.purchasedAt)) })

  // Create course
  const { writeContract: createCourse, data: createTxHash, isPending: isCreatePending } = useWriteContract()
  const { isSuccess: isCreateSuccess, isLoading: isCreateConfirming } = useWaitForTransactionReceipt({
    hash: createTxHash,
    chainId: ACTIVE_CHAIN_ID,
  })

  const derivedCreateStep: TxStep = (() => {
    if (createStep === 'error') return 'error'
    if (isCreateSuccess) return 'success'
    if (isCreateConfirming) return 'confirming'
    if (createTxHash) return 'confirming'   // hash landed — now waiting for receipt
    if (isCreatePending) return 'signing'   // wallet prompt open
    return createStep
  })()

  useEffect(() => {
    if (isCreateSuccess && createTxHash && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success('Course listed successfully!')
      setTimeout(() => window.location.reload(), 3000)
    }
  }, [isCreateSuccess, createTxHash])

  const handleCreate = () => {
    if (!form.title.trim() || !form.price || !isConnected) return
    if (isWrongChain) { switchChain({ chainId: ACTIVE_CHAIN_ID }); return }
    if (!contractDeployed) { toast.error('Unable to connect to contract. Please try again.'); return }
    setCreateError('')
    setCreateStep('signing')
    const priceRaw = BigInt(Math.round(parseFloat(form.price) * 1_000_000))
    const multiplier = { seconds: 1, minutes: 60, hours: 3600, days: 86400 }[form.refundUnit]
    const windowSec = BigInt(Math.max(30, Math.round(parseFloat(form.refundValue) * multiplier)))
    createCourse({
      address: REVERSA_ADDRESS, abi: REVERSA_ABI, functionName: 'createCourse',
      args: [form.title.trim(), form.description.trim(), priceRaw, windowSec],
      chainId: ACTIVE_CHAIN_ID,
    }, {
      onSuccess: () => setForm({ title: '', description: '', price: '', refundValue: '7', refundUnit: 'days' }),
      onError: (err) => { setCreateStep('error'); setCreateError(parseOnchainError(err)) },
    })
  }

  // Release payment
  const { writeContract: releasePayment, data: releaseTxHash, isPending: isReleasePending } = useWriteContract()
  const { isSuccess: isReleaseSuccess, isLoading: isReleaseConfirming } = useWaitForTransactionReceipt({
    hash: releaseTxHash,
    chainId: ACTIVE_CHAIN_ID,
  })

  const derivedReleaseStep: TxStep = (() => {
    if (releaseStep === 'error') return 'error'
    if (isReleaseSuccess) return 'success'
    if (isReleaseConfirming) return 'confirming'
    if (releaseTxHash) return 'confirming'
    if (isReleasePending) return 'signing'
    return releaseStep
  })()

  useEffect(() => {
    if (isReleaseSuccess && releaseTxHash && !releaseNotifiedRef.current) {
      releaseNotifiedRef.current = true
      toast.success('Payment released!')
      setTimeout(() => window.location.reload(), 3000)
    }
  }, [isReleaseSuccess, releaseTxHash])

  const handleRelease = (purchaseId: bigint) => {
    if (isWrongChain) { switchChain({ chainId: ACTIVE_CHAIN_ID }); return }
    setReleaseError('')
    setReleaseStep('signing')
    releasePayment({
      address: REVERSA_ADDRESS, abi: REVERSA_ABI, functionName: 'releasePayment',
      args: [purchaseId],
      chainId: ACTIVE_CHAIN_ID,
    }, {
      onError: (err) => { setReleaseStep('error'); setReleaseError(parseOnchainError(err)) },
    })
  }

  // Stats — tick every 5s so Release button appears promptly after window expires
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 5000)
    return () => clearInterval(id)
  }, [])
  const totalRevenue = purchases.filter(p => p.status === PurchaseStatus.Released).reduce((s, p) => s + p.amount, 0n)
  const totalProtected = purchases.filter(p => p.status === PurchaseStatus.Protected).reduce((s, p) => s + p.amount, 0n)
  const eligibleCount = purchases.filter(p => {
    return p.status === PurchaseStatus.Protected && BigInt(nowSec) > p.refundDeadline
  }).length

  if (!isConnected) {
    return (
      <div className="min-h-dvh pt-24 flex flex-col items-center justify-center bg-[#f8f9fb] px-4">
        <Zap size={40} className="text-blue-200 mb-4" />
        <h2 className="text-xl font-bold text-[#0f1a2e] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Connect to access the Creator Dashboard</h2>
        <p className="text-slate-400 text-sm mb-6">Create and manage your courses with smart contract payment protection.</p>
        <ConnectKitButton />
      </div>
    )
  }

  return (
    <div className="min-h-dvh pt-20 pb-16 bg-[#f8f9fb]">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold text-[#0f1a2e] mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>Creator Dashboard</h1>
          <p className="text-sm text-slate-400 font-mono">{address}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Courses Listed" value={String((courseIds as bigint[] | undefined)?.length ?? 0)} accent="bg-blue-700" />
          <StatCard icon={DollarSign} label="Total Revenue" value={formatUsdc(totalRevenue)} accent="bg-emerald-600" />
          <StatCard icon={RefreshCcw} label="In Escrow" value={formatUsdc(totalProtected)} accent="bg-amber-500" />
          <StatCard icon={Zap} label="Eligible to Release" value={String(eligibleCount)} accent="bg-violet-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Course */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Create a Course</h2>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              {isWrongChain && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Switch to Arc to create courses.
                  <button onClick={() => switchChain({ chainId: ACTIVE_CHAIN_ID })} className="ml-auto font-semibold underline">Switch</button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Course Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Advanced Solidity Patterns"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What will students learn?"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-300 focus:bg-white transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Price (USDC) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="25.00"
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-300 focus:bg-white transition-colors tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Refund Window</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.refundValue}
                      onChange={e => setForm(f => ({ ...f, refundValue: e.target.value }))}
                      min="1"
                      step="1"
                      placeholder="7"
                      className="w-24 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-300 focus:bg-white transition-colors tabular-nums"
                    />
                    <select
                      value={form.refundUnit}
                      onChange={e => setForm(f => ({ ...f, refundUnit: e.target.value as typeof f.refundUnit }))}
                      className="flex-1 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                The refund window is unconditional. Students may request a full refund for any reason within this period. This is transparent and verifiable by all parties onchain.
              </div>

              {derivedCreateStep !== 'idle' && (
                <TxSteps step={derivedCreateStep} hash={createTxHash} error={createError} labels={{ signing: 'Confirm course creation', success: 'Course listed successfully!' }} />
              )}

              <button
                onClick={handleCreate}
                disabled={!form.title.trim() || !form.price || isCreatePending || derivedCreateStep === 'signing' || derivedCreateStep === 'confirming' || derivedCreateStep === 'success'}
                className="w-full py-3 bg-[#1e3a8a] text-white font-semibold rounded-xl hover:bg-[#1e40af] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isCreatePending || derivedCreateStep === 'signing' || derivedCreateStep === 'confirming' ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating...</>
                ) : derivedCreateStep === 'success' ? (
                  <><Check size={16} /> Course Created!</>
                ) : (
                  <><PlusCircle size={16} /> List Course on Reversa</>
                )}
              </button>

              {createTxHash && (
                <a href={buildTxExplorerUrl(ACTIVE_CHAIN_ID, createTxHash)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 text-xs text-blue-600">
                  View transaction <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* My Courses */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">My Courses</h2>
            {!contractDeployed ? (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-700 flex items-start gap-3">
                <AlertCircle size={18} className="flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Contract not deployed</p>
                  <p>Deploy ReversaEscrow.sol and set <code className="font-mono bg-amber-100 px-1 rounded">VITE_REVERSA_CONTRACT_ADDRESS</code> in .env to see courses.</p>
                </div>
              </div>
            ) : (courseIds as bigint[] | undefined)?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">
                <BookOpen size={28} className="mx-auto mb-3 opacity-30" />
                No courses yet. Create your first one.
              </div>
            ) : (
              <div className="space-y-4">
                {(courseIds as bigint[] | undefined)?.map(id => (
                  <CourseLoader key={String(id)} courseId={id} onLoaded={handleCourseLoaded} />
                ))}
                {courses.map(c => <CourseCard key={String(c.courseId)} course={c} purchases={purchases} />)}
              </div>
            )}
          </div>
        </div>

        {/* Release payments */}
        {(purchaseIds as bigint[] | undefined)?.map(id => (
          <PurchaseLoader key={String(id)} purchaseId={id} onLoaded={handlePurchaseLoaded} />
        ))}

        {purchases.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Purchase Ledger</h2>
            {derivedReleaseStep !== 'idle' && <TxSteps step={derivedReleaseStep} hash={releaseTxHash} error={releaseError} labels={{ signing: 'Confirm payment release', success: 'Payment released!' }} className="mb-4" />}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
              {purchases.slice(0, 20).map(p => (
                <PurchaseRow key={String(p.purchaseId)} purchase={p} onRelease={handleRelease} nowSec={nowSec} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


