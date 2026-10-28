import { Link } from 'react-router-dom'
import { Shield, Github, Twitter } from 'lucide-react'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="bg-[#0f1a2e] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <Logo size={28} showText textClass="text-white text-xl" className="mb-4" />
            <p className="text-sm leading-relaxed max-w-xs text-slate-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              A decentralized payment protection platform for online courses. Your USDC stays in escrow until you're satisfied — or the refund window expires.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-500">
              <Shield size={12} />
              <span>Smart contract enforced on Arc Mainnet</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Platform</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/courses', label: 'Explore Courses' },
                { to: '/how-it-works', label: 'How It Works' },
                { to: '/dashboard', label: 'Student Dashboard' },
                { to: '/creator', label: 'Creator Dashboard' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>On Arc Mainnet</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="https://explorer.arc.io" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Block Explorer</a></li>
              <li><a href="https://developers.circle.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Circle Developers</a></li>
              <li><a href="https://docs.arc.io" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Arc Docs</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 Reversa. Built on Arc — where USDC is native gas.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Github size={16} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Twitter size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
