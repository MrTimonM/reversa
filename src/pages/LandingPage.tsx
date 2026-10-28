import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, RefreshCcw, FileCheck, ArrowRight, ChevronDown,
  Lock, Zap, Globe, BookOpen, ChevronUp
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

// --- Flow step component ---
function FlowStep({ icon: Icon, label, sub, accent }: { icon: React.ElementType; label: string; sub: string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center flex-1 min-w-0">
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm', accent)}>
        <Icon size={24} className="text-white" />
      </div>
      <p className="font-semibold text-slate-800 text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{label}</p>
      <p className="text-xs text-slate-500 leading-snug max-w-[90px]">{sub}</p>
    </div>
  )
}

// --- Feature card ---
function FeatureCard({ icon: Icon, title, desc, iconBg }: { icon: React.ElementType; title: string; desc: string; iconBg: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4', iconBg)}>
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="font-semibold text-[#0f1a2e] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: 'DM Sans, sans-serif' }}>{desc}</p>
    </motion.div>
  )
}

// --- FAQ Item ---
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-[#0f1a2e] text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{q}</span>
        {open ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-sm text-slate-500 pb-5 leading-relaxed"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {a}
        </motion.p>
      )}
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-blue-50 via-cyan-50 to-transparent rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-8 tracking-wide uppercase">
              <Shield size={12} />
              Powered by Arc — USDC as native gas
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0f1a2e] leading-tight mb-6 text-balance"
              style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em' }}
            >
              Learn with confidence.<br />
              <span className="bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                Pay with protection.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed text-pretty"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Buy online courses with USDC. Your payment stays protected by smart contracts until the refund window ends. No support tickets. No endless waiting.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1e3a8a] text-white font-semibold rounded-xl hover:bg-[#1e40af] transition-colors shadow-sm"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Explore Courses <ArrowRight size={16} />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0f1a2e] font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                See How It Works
              </Link>
            </motion.div>
          </motion.div>

          {/* Flow visual */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 bg-white rounded-3xl border border-slate-100 shadow-lg p-8 max-w-2xl mx-auto"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">How your money moves</p>
            <div className="flex items-start justify-between gap-4">
              <FlowStep icon={BookOpen} label="Student" sub="Pays USDC" accent="bg-blue-600" />
              <div className="flex items-center mt-5">
                <div className="w-8 h-px bg-slate-200" />
                <ArrowRight size={14} className="text-slate-400" />
              </div>
              <FlowStep icon={Lock} label="Smart Contract" sub="Holds in escrow" accent="bg-slate-700" />
              <div className="flex items-center mt-5">
                <div className="w-8 h-px bg-slate-200" />
                <ArrowRight size={14} className="text-slate-400" />
              </div>
              <FlowStep icon={RefreshCcw} label="Refund or" sub="Pay creator" accent="bg-cyan-600" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.p variants={fadeUp} className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Core features</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-[#0f1a2e] tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
              Protection you can verify onchain
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <FeatureCard
              icon={Lock}
              title="Protected Payments"
              iconBg="bg-blue-700"
              desc="Your USDC is held in a smart contract — not with us, not with the creator. Nobody can touch it before the rules are met."
            />
            <FeatureCard
              icon={RefreshCcw}
              title="Self-Service Refunds"
              iconBg="bg-cyan-600"
              desc="Request a refund yourself, onchain, within the guarantee period. No forms, no emails, no gatekeepers. Just one transaction."
            />
            <FeatureCard
              icon={FileCheck}
              title="Transparent Guarantees"
              iconBg="bg-indigo-600"
              desc="Every refund deadline and escrow balance is public on Arc. You can verify exactly what protection you have at any time."
            />
            <FeatureCard
              icon={Zap}
              title="Instant Settlement"
              iconBg="bg-amber-500"
              desc="On Arc, USDC is the native gas token. Transactions confirm in under a second with stable, predictable fees."
            />
            <FeatureCard
              icon={Shield}
              title="No Admin Access"
              iconBg="bg-slate-700"
              desc="The contract has zero back-doors. No admin can withdraw escrowed funds. The code enforces the rules — not our promises."
            />
            <FeatureCard
              icon={Globe}
              title="Permissionless Creation"
              iconBg="bg-emerald-600"
              desc="Any creator can list a course and set their own refund window. No approval process, no platform permission required."
            />
          </motion.div>
        </div>
      </section>

      {/* How it works summary */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-4xl font-bold text-[#0f1a2e] tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
              Simple. Automatic. Trustless.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', title: 'Browse and choose a course', desc: 'Connect your wallet, find a course, and review the price and refund guarantee window set by the creator.' },
              { num: '02', title: 'Purchase with USDC', desc: 'Approve the USDC spend and confirm the purchase transaction. Your payment enters the smart contract escrow automatically.' },
              { num: '03', title: "Request a refund if you're not satisfied", desc: 'Within the guarantee window, you can request a full refund yourself — no questions asked, no waiting on support.' },
              { num: '04', title: 'Creator receives payment after the deadline', desc: 'Once the refund window expires and no refund was requested, the creator can release and claim their payment.' },
            ].map((step) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="flex gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0f1a2e] mb-1 text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 text-blue-700 font-medium text-sm hover:text-blue-800"
            >
              See the full explainer <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits split */}
      <section className="py-20 px-4 sm:px-6 bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For students */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mb-6">
                <BookOpen size={18} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#0f1a2e] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>For Students</h3>
              <ul className="space-y-3">
                {[
                  'Buy any course with a verifiable money-back guarantee.',
                  'Request your refund yourself — onchain, instantly.',
                  'Your funds are held in code, not on a platform server.',
                  'Full transaction history on the Arc block explorer.',
                  'No account required — just connect your wallet.',
                ].map((item) => (
                  <li key={item} className="flex gap-3 items-start text-sm text-slate-600" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* For creators */}
            <div className="bg-[#0f1a2e] rounded-3xl p-8 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center mb-6">
                <Zap size={18} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>For Creators</h3>
              <ul className="space-y-3">
                {[
                  'List your course permissionlessly — no approval needed.',
                  'Set your own price and refund window.',
                  'Guaranteed payment once the window expires.',
                  'Track purchases and revenue onchain.',
                  'Claim your USDC when you are eligible.',
                ].map((item) => (
                  <li key={item} className="flex gap-3 items-start text-sm text-slate-300" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl font-bold text-[#0f1a2e] tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
              Common questions
            </h2>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-100 px-6">
            {[
              {
                q: 'Who holds my USDC during the escrow period?',
                a: 'The ReversaEscrow smart contract holds your USDC — not us, not the creator, and not any third party. The contract code is public and can be verified by anyone on the Arc block explorer.',
              },
              {
                q: 'Can the refund deadline be changed after I purchase?',
                a: 'No. When you purchase, the contract takes a snapshot of the price and refund window at that moment. Any later edits by the creator cannot affect your existing purchase.',
              },
              {
                q: 'Does Reversa verify that the course content is good?',
                a: 'Reversa enforces the payment guarantee onchain, but does not independently verify course quality, completion, or third-party content access. The refund window is unconditional — you can request it for any reason.',
              },
              {
                q: 'What happens if I miss the refund window?',
                a: 'Once the deadline expires and you have not requested a refund, the creator becomes eligible to release the payment. The contract enforces this automatically.',
              },
              {
                q: 'Is this an escrow or a direct payment?',
                a: 'It is an escrow. Your USDC is sent to the contract — not to the creator — when you purchase. The creator can only receive it after the refund window closes with no refund requested.',
              },
              {
                q: 'What network does Reversa run on?',
                a: 'Reversa runs on Arc. Arc is a blockchain where USDC is the native gas token, making every transaction denominated entirely in USDC.',
              },
            ].map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Shield size={28} className="text-cyan-400" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
              Your money-back guarantee<br />you can actually trust.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-300 mb-8 leading-relaxed">
              Browse courses now and experience onchain payment protection for yourself.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#0f1a2e] font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Explore Courses <ArrowRight size={16} />
              </Link>
              <Link
                to="/creator"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                List Your Course
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
