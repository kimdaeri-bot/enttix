'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
const SearchBar = dynamic(() => import('./SearchBar'), { ssr: false });

const sportsItems = [
  'Football', 'Tennis', 'Golf', 'Rugby', 'Cricket', 'Formula 1', 'MotoGP',
  'Boxing', 'UFC', 'Darts', 'Ice Hockey', 'Basketball', 'Baseball',
  'American Football', 'Winter Games', 'Athletics', 'Cycling',
];

const showsItems = [
  'West End', 'Broadway', 'Opera', 'Ballet', 'Comedy', 'Drama',
  'Family Shows', 'Dance', 'Circus', 'Magic Shows',
];

const musicItems = [
  'Pop', 'Rock', 'Rap/Hip-hop', 'R&B', 'Country', 'Latin',
  'Alternative', 'Electronic', 'Soul', 'Classical', 'Jazz', 'Metal',
];

const attractionItems = [
  'London', 'Paris', 'Barcelona', 'Rome',
  'Amsterdam', 'Dubai', 'Singapore', 'Prague',
  'Madrid', 'Vienna', 'New York', 'Tokyo',
  'All Destinations',
];

const popularDropdownItems = [
  { key: 'premier-league', label: 'Premier League',        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key: 'serie-a',        label: 'Italian Serie A',       flag: '🇮🇹' },
  { key: 'la-liga',        label: 'Spanish La Liga',       flag: '🇪🇸' },
  { key: 'bundesliga',     label: 'Bundesliga',            flag: '🇩🇪' },
  { key: 'ucl',            label: 'Champions League',      flag: '🏆' },
  { key: 'world-cup',      label: 'FIFA World Cup',        flag: '🌍' },
  { key: 'mls',            label: 'MLS',                   flag: '🇺🇸' },
  { key: 'mlb',            label: 'MLB',                   flag: '⚾' },
  { key: 'nba',            label: 'NBA',                   flag: '🏀' },
  { key: 'nfl',            label: 'NFL',                   flag: '🏈' },
  { key: 'formula1',       label: 'Formula 1',             flag: '🏎️' },
  { key: 'london-musical', label: 'London Musical',        flag: '🎭' },
  { key: 'broadway',       label: 'Broadway Musical',      flag: '🗽' },
];

function PopularDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white rounded-[12px] shadow-xl border border-[#E5E7EB] py-2 min-w-[280px] z-50">
      <p className="px-4 py-1.5 text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold">Popular Categories</p>
      <div className="grid grid-cols-2">
        {popularDropdownItems.map(item => (
          <Link
            key={item.key}
            href={`/popular#${item.key}`}
            className="flex items-center gap-2 px-4 py-2 text-[13px] text-[#374151] hover:bg-[#F1F5F9] hover:text-[#2B7FFF] transition-colors"
            onClick={onClose}
          >
            <span>{item.flag}</span> {item.label}
          </Link>
        ))}
      </div>
      <div className="border-t border-[#E5E7EB] mt-1 pt-1">
        <Link
          href="/popular"
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-[#2B7FFF] hover:bg-[#EFF6FF] transition-colors"
          onClick={onClose}
        >
          🔥 View All Popular →
        </Link>
      </div>
    </div>
  );
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function DropdownMenu({ items, basePath, onClose }: { items: string[]; basePath: string; onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white rounded-[12px] shadow-xl border border-[#E5E7EB] py-2 min-w-[220px] z-50 grid grid-cols-2 gap-0">
      {items.map(item => (
        <Link
          key={item}
          href={`${basePath}/${toSlug(item)}`}
          className="px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#F1F5F9] hover:text-[#2B7FFF] transition-colors"
          onClick={onClose}
        >
          {item}
        </Link>
      ))}
    </div>
  );
}

export default function Header({ transparent = false, hideSearch = false }: { transparent?: boolean; hideSearch?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toggleSection = (name: string) => setMobileExpanded(prev => prev === name ? null : name);
  const { user, signOut } = useAuth();
  let cartBadge = 0;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { totalItems } = useCart();
    cartBadge = totalItems;
  } catch {
    // CartProvider not mounted yet
  }

  const handleEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(name);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <>
    <header className={`w-full px-4 md:px-10 py-0 relative z-50 ${transparent ? '' : 'bg-[#0F172A]'}`}>
      <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[80px]">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="text-white font-extrabold text-[24px] italic tracking-[-1px]">enttix</div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {/* Popular dropdown */}
          <div className="relative" onMouseEnter={() => handleEnter('popular')} onMouseLeave={handleLeave}>
            <Link
              href="/popular"
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors flex items-center gap-1"
            >
              🔥 Popular
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5"><path d="M6 9l6 6 6-6"/></svg>
            </Link>
            {openDropdown === 'popular' && <PopularDropdown onClose={() => setOpenDropdown(null)} />}
          </div>

          {/* Sports dropdown */}
          <div className="relative" onMouseEnter={() => handleEnter('sports')} onMouseLeave={handleLeave}>
            <Link
              href="/sport/football"
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors flex items-center gap-1"
            >
              Sports
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5"><path d="M6 9l6 6 6-6"/></svg>
            </Link>
            {openDropdown === 'sports' && <DropdownMenu items={sportsItems} basePath="/sport" onClose={() => setOpenDropdown(null)} />}
          </div>

          {/* Shows dropdown */}
          <div className="relative" onMouseEnter={() => handleEnter('shows')} onMouseLeave={handleLeave}>
            <Link
              href="/shows"
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors flex items-center gap-1"
            >
              Shows
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5"><path d="M6 9l6 6 6-6"/></svg>
            </Link>
            {openDropdown === 'shows' && <DropdownMenu items={showsItems} basePath="/musical" onClose={() => setOpenDropdown(null)} />}
          </div>

          {/* Music dropdown */}
          <div className="relative" onMouseEnter={() => handleEnter('music')} onMouseLeave={handleLeave}>
            <Link
              href="/music"
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors flex items-center gap-1"
            >
              Music
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5"><path d="M6 9l6 6 6-6"/></svg>
            </Link>
            {openDropdown === 'music' && <DropdownMenu items={musicItems} basePath="/concert" onClose={() => setOpenDropdown(null)} />}
          </div>

          {/* Attractions dropdown */}
          <div className="relative" onMouseEnter={() => handleEnter('attractions')} onMouseLeave={handleLeave}>
            <Link
              href="/attractions"
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors flex items-center gap-1"
            >
              Attractions
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5"><path d="M6 9l6 6 6-6"/></svg>
            </Link>
            {openDropdown === 'attractions' && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-[12px] shadow-xl border border-[#E5E7EB] py-2 min-w-[220px] z-50">
                <div className="grid grid-cols-2 gap-0">
                  {attractionItems.map(item => (
                    <Link
                      key={item}
                      href={item === 'All Destinations' ? '/attractions' : `/attractions/${toSlug(item)}`}
                      className="px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#F1F5F9] hover:text-[#2B7FFF] transition-colors"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {item}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-[#E5E7EB] mt-1 pt-1">
                  <Link
                    href="/attractions#browse-countries"
                    className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-[#2B7FFF] hover:bg-[#EFF6FF] transition-colors"
                    onClick={() => setOpenDropdown(null)}
                  >
                    🌍 Browse Countries →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link href="/entertainment" className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors">
            Entertainment
          </Link>
          <Link href="/planner" className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors flex items-center gap-1">
            ✨ Planner
          </Link>

          <div className="w-[1px] h-8 bg-[rgba(255,255,255,0.2)] mx-2" />

          {/* Cart icon */}
          <Link href="/cart" className="relative px-3 py-2.5 text-[#DBEAFE] hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            {cartBadge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
                {cartBadge}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#2B7FFF] flex items-center justify-center text-white text-[12px] font-bold">
                  {(user.email?.[0] || 'U').toUpperCase()}
                </div>
              </button>
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-2 min-w-[180px] z-50">
                  <p className="px-4 py-2 text-[12px] text-[#94A3B8] truncate">{user.email}</p>
                  <Link href="/mypage?tab=orders" className="block px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#F1F5F9]" onClick={() => setShowUserMenu(false)}>🎫 My Orders</Link>
                  <Link href="/mypage?tab=trips" className="block px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#F1F5F9]" onClick={() => setShowUserMenu(false)}>✈️ My Trips</Link>
                  <button onClick={() => { signOut(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] text-[#EF4444] hover:bg-[#FEF2F2]">Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="px-5 py-2.5 rounded-full text-[14px] font-semibold text-[#DBEAFE] hover:text-white transition-colors">
              Sign In
            </Link>
          )}
          <Link href="/sell" className="ml-2 px-5 py-2.5 rounded-[8px] bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[14px] font-semibold transition-colors">
            Sell Tickets
          </Link>
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 rounded-lg border border-[rgba(255,255,255,0.2)] hover:border-white/40 flex items-center justify-center text-white transition-all active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden pb-6 border-t border-white/10">

          {/* ── 상단: 계정 / 네비 ── */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            {user ? (
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-9 h-9 rounded-full bg-[#2B7FFF] flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                  {(user.email?.[0] || 'U').toUpperCase()}
                </div>
                <p className="text-[12px] text-[#94A3B8] truncate">{user.email}</p>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/mypage?tab=orders" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-[13px] font-semibold text-[#DBEAFE] hover:bg-white/15 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                My Orders
              </Link>
              <Link href="/mypage?tab=trips" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-[13px] font-semibold text-[#DBEAFE] hover:bg-white/15 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.1 1.14 2 2 0 012.08 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6z"/></svg>
                My Trips
              </Link>
              <Link href="/planner" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-[13px] font-semibold text-[#DBEAFE] hover:bg-white/15 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                ✨ Planner
              </Link>
              {user ? (
                <button onClick={() => { signOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#EF4444]/15 text-[13px] font-semibold text-[#FCA5A5] hover:bg-[#EF4444]/25 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Sign Out
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#2B7FFF]/20 text-[13px] font-semibold text-[#93C5FD] hover:bg-[#2B7FFF]/30 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* ── 카테고리 (접기/펼치기) ── */}
          <div className="mt-2 px-2">
            {[
              { key: 'sports',      label: '🏆 Sports',      items: sportsItems,     basePath: '/sport' },
              { key: 'shows',       label: '🎭 Shows',       items: showsItems,      basePath: '/musical' },
              { key: 'music',       label: '🎵 Music',       items: musicItems,      basePath: '/concert' },
              { key: 'attractions', label: '🗺️ Attractions', items: attractionItems, basePath: '/attractions' },
            ].map(({ key, label, items, basePath }) => (
              <div key={key} className="border-b border-white/8">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-3 py-3.5 text-[15px] font-semibold text-[#DBEAFE]"
                >
                  <span>{label}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={`transition-transform duration-200 text-[#64748B] ${mobileExpanded === key ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {mobileExpanded === key && (
                  <div className="pb-2 grid grid-cols-2 gap-0">
                    {items.map(item => (
                      <Link
                        key={item}
                        href={key === 'attractions' && item === 'All Destinations' ? '/attractions' : `${basePath}/${toSlug(item)}`}
                        className="px-5 py-2 text-[13px] text-[#93C5FD] hover:text-white"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item}
                      </Link>
                    ))}
                    {key === 'attractions' && (
                      <Link href="/attractions#browse-countries" className="col-span-2 px-5 py-2 text-[13px] font-semibold text-[#60A5FA]" onClick={() => setMobileOpen(false)}>
                        🌍 Browse Countries →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 기타 링크 */}
            <Link href="/popular" className="flex items-center px-3 py-3.5 text-[15px] font-semibold text-[#DBEAFE] border-b border-white/8" onClick={() => setMobileOpen(false)}>🔥 Popular</Link>
            <Link href="/entertainment" className="flex items-center px-3 py-3.5 text-[15px] font-semibold text-[#DBEAFE] border-b border-white/8" onClick={() => setMobileOpen(false)}>🎬 Entertainment</Link>
            <Link href="/planner" className="flex items-center px-3 py-3.5 text-[15px] font-semibold text-[#DBEAFE]" onClick={() => setMobileOpen(false)}>✨ Planner</Link>
          </div>

          <div className="px-4 mt-4">
            <Link href="/sell" className="block px-4 py-3 text-center text-[15px] font-semibold text-white bg-[#2B7FFF] rounded-[10px]" onClick={() => setMobileOpen(false)}>
              Sell Tickets
            </Link>
          </div>
        </div>
      )}
    </header>
    {!hideSearch && (
      <div className="bg-[#F5F7FA] pt-6 pb-2 px-4 relative z-40">
        <div className="max-w-[1280px] mx-auto flex justify-center">
          <SearchBar inline />
        </div>
      </div>
    )}
    </>
  );
}
