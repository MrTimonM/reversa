import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Lock, RefreshCcw, Coins, BookOpen, Clock, AlertCircle } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

type Step = {
  num: string
  title: string
  description: string
  detail: string
  icon: React.ElementType
  iconBg: string
  role: 'student' | 'contract' | 'creator'
}

const STEPS: Step[] = [
  {
    num: '01',
    title: 'Student connects wallet and browses courses',
    description: 'Connect any EVM-compatible wallet (MetaMask, etc.) to Arc and explore the course marketplace.',
    detail: 'The app verifies your network and shows your USDC balance. No account required — your wallet address is your identity.',
    icon: BookOpen,
    iconBg: 'bg-blue-700',
    role: 'student',
  },
  {
    num: '02',
    title: 'Student approves and purchases with USDC',
    description: "Select a course, review the price and refund guarantee period, then approve the USDC spend and confirm the purchase.",
    detail: 'Two transactions: one to approve the contract to spend your USDC, and one to execute the purchase. The contract price and refund window are snapshotted at this moment — later edits by the creator have no effect on your purchase.',
    icon: Coins,
    iconBg: 'bg-blue-700',
    role: 'student',
  },
  {
    num: '03',
    title: 'USDC enters smart contract escrow',
    description: "Your payment goes directly to the ReversaEscrow contract — not to us, not to the creator, and not to any intermediary.",
    detail: 'The contract records your wallet address, the course ID, the amount, the purchase timestamp, and the refund deadline. The funds are locked in the contract and can only be released by the rules encoded in Solidity.',
    icon: Lock,
    iconBg: 'bg-slate-700',
    role: 'contract',
  },
  {
    num: '04',
    title: 'Student may request a full refund',
    description: 'Within the guarantee period, you can request a full refund yourself — onchain, with no permission from anyone.',
    detail: 'One transaction: callrequestRefund(purchaseId) on the contract. Your USDC is returned immediately. No support tickets, no waiting, no questions. This refund window is unconditional — it does not depend on whether you accessed the content or found it valuable.',
    icon: RefreshCcw,
    iconBg: 'bg-cyan-600',
    role: 'student',
  },
  {
    num: '05',
    title: 'After expiry, creator releases their payment',
    description: "Once the refund window closes and no refund was requested, the creator becomes eligible to claim the USDC.",
    detail: 'The creator calls releasePayment(purchaseId) and the USDC is transferred to their wallet. This can only happen after the deadline. The creator cannot pull funds early — the contract enforces this.',
    icon: Coins,
    iconBg: 'bg-emerald-600',
    role: 'creator',
  },
]

const ROLE_LABEL: Record<Step['role'], string> = {
  student: 'Student action',
  contract: 'Smart contract',
  creator: 'Creator action',
}

const ROLE_COLOR: Record<Step['role'], string> = {
  student: 'bg-blue-50 text-blue-700',
  contract: 'bg-slate-100 text-slate-600',
  creator: 'bg-emerald-50 text-emerald-700',
}

export function HowItWorksPage() {
  return (
    <div className="min-h-dvh pt-20 pb-16 bg-[#f8f9fb]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Process</motion.p>
          <motion.h1 initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: 0.05 } } }}
            className="text-4xl sm:text-5xl font-bold text-[#0f1a2e] tracking-tight mb-4 text-balance"
            style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em' }}>
            How Reversa works
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} className="text-slate-500 max-w-xl mx-auto leading-relaxed text-pretty">
            Every step is enforced by the ReversaEscrow smart contract on Arc. Nobody has special access — not us, not the creator.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Steps */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-6"
        >
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex gap-5"
              >
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${step.iconBg}`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px flex-1 bg-slate-100 my-3 min-h-[24px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400">{step.num}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[step.role]}`}>{ROLE_LABEL[step.role]}</span>
                  </div>
                  <h3 className="font-bold text-[#0f1a2e] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{step.title}</h3>
                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">{step.description}</p>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{step.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Security section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#0f1a2e] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>Security design</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: 'Reentrancy protection', desc: 'All state-changing functions use OpenZeppelin\'s ReentrancyGuard.' },
              { icon: Lock, title: 'Checks-effects-interactions', desc: 'Purchase status is updated to its final value before any token transfer occurs.' },
              { icon: RefreshCcw, title: 'Purchase snapshots', desc: 'Price and refund window are recorded at purchase time. Creator edits do not affect existing orders.' },
              { icon: AlertCircle, title: 'No admin withdrawals', desc: 'There is no function that allows anyone to withdraw escrowed funds bypassing the student or creator rules.' },
              { icon: Clock, title: 'Deadline enforcement', desc: 'Refunds are only possible before the deadline. Releases are only possible after it.' },
              { icon: Coins, title: 'Safe ERC-20 transfers', desc: 'All token transfers use OpenZeppelin\'s SafeERC20 wrappers to handle non-standard tokens.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#0f1a2e] text-sm mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-2">What Reversa does and does not do</h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              Reversa enforces payment guarantees onchain. It does <strong>not</strong> independently verify course quality, actual content delivery, learning outcomes, completion, or access to third-party platforms. The refund window is unconditional — students may request a refund for any reason during the period. Both creators and students should understand this before transacting.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/courses" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1e3a8a] text-white font-semibold rounded-xl hover:bg-[#1e40af] transition-colors text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Browse Courses <ArrowRight size={16} />
          </Link>
          <Link to="/creator" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0f1a2e] font-semibold rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Become a Creator
          </Link>
        </div>
      </div>
    </div>
  )
}
