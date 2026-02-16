'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Header({ transparent = false }: { transparent?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user] = useState<{ name: string } | null>(null); // TODO: auth

  const navLinks = [
    { href: '/all-tickets', label: 'All Tickets' },
    { href: '/leagues', label: 'Leagues' },
    { href: '/cities', label: 'Cities' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className={`w-full px-4 md:px-10 py-0 ${transparent ? '' : 'bg-[#0F172A]'}`}>
      <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[80px]">
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="text-white font-extrabold text-[24px] italic tracking-[-1px]">
            enttix
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="w-[1px] h-8 bg-[rgba(255,255,255,0.2)] mx-2" />
          {user ? (
            <Link href="/mypage" className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[14px] font-semibold">
                {user.name[0]}
              </div>
              <span className="text-[14px] max-w-[120px] truncate">{user.name}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold text-[#DBEAFE] hover:text-white transition-colors"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 rounded-lg border border-[rgba(255,255,255,0.2)] hover:border-white/40 flex items-center justify-center text-white transition-all active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden pb-4">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-3 text-[16px] font-semibold text-[#DBEAFE] hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="block px-4 py-3 text-[16px] font-semibold text-[#DBEAFE] hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </header>
  );
}
