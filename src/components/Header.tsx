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

const concertItems = [
  'Pop', 'Rock', 'Rap/Hip-hop', 'R&B', 'Country', 'Latin',
  'Alternative', 'Electronic', 'Soul', 'Classical', 'Jazz', 'Metal',
];

const musicalItems = [
  'West End', 'Broadway', 'Opera', 'Ballet', 'Comedy', 'Drama',
  'Family Shows', 'Dance', 'Circus', 'Magic Shows',
];

const attractionItems = [
  'London', 'Paris', 'Barcelona', 'Rome',
  'Amsterdam', 'Dubai', 'Singapore', 'Prague',
  'Madrid', 'Vienna', 'New York', 'Tokyo',
  'All Destinations',
];

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
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

          {/* Concerts dropdown */}
          <div className="relative" onMouseEnter={() => handleEnter('concerts')} onMouseLeave={handleLeave}>
            <Link
              href="/concert/pop"
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors flex items-center gap-1"
            >
              Concerts
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5"><path d="M6 9l6 6 6-6"/></svg>
            </Link>
            {openDropdown === 'concerts' && <DropdownMenu items={concertItems} basePath="/concert" onClose={() => setOpenDropdown(null)} />}
          </div>

          {/* Musical dropdown */}
          <div className="relative" onMouseEnter={() => handleEnter('musical')} onMouseLeave={handleLeave}>
            <Link
              href="/musical/west-end"
              className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors flex items-center gap-1"
            >
              뮤지컬
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5"><path d="M6 9l6 6 6-6"/></svg>
            </Link>
            {openDropdown === 'musical' && <DropdownMenu items={musicalItems} basePath="/musical" onClose={() => setOpenDropdown(null)} />}
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

          <Link href="/all-tickets" className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors">
            All Tickets
          </Link>
          <Link href="/cities" className="px-5 py-2.5 rounded-full text-[14px] font-semibold leading-[20px] tracking-[-0.15px] text-[#DBEAFE] hover:text-white transition-colors">
            Cities
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
                  <Link href="/mypage" className="block px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#F1F5F9]" onClick={() => setShowUserMenu(false)}>My Trips</Link>
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
        <div className="md:hidden pb-4">
          <div className="mb-2">
            <p className="px-4 py-2 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Sports</p>
            {sportsItems.map(item => (
              <Link key={item} href={`/sport/${toSlug(item)}`} className="block px-6 py-2 text-[14px] text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>
                {item}
              </Link>
            ))}
          </div>
          <div className="mb-2">
            <p className="px-4 py-2 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Concerts</p>
            {concertItems.map(item => (
              <Link key={item} href={`/concert/${toSlug(item)}`} className="block px-6 py-2 text-[14px] text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>
                {item}
              </Link>
            ))}
          </div>
          <div className="mb-2">
            <p className="px-4 py-2 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">뮤지컬</p>
            {musicalItems.map(item => (
              <Link key={item} href={`/musical/${toSlug(item)}`} className="block px-6 py-2 text-[14px] text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>
                {item}
              </Link>
            ))}
          </div>
          <div className="mb-2">
            <p className="px-4 py-2 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">Attractions</p>
            {attractionItems.map(item => (
              <Link
                key={item}
                href={item === 'All Destinations' ? '/attractions' : `/attractions/${toSlug(item)}`}
                className="block px-6 py-2 text-[14px] text-[#DBEAFE] hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </Link>
            ))}
            <Link
              href="/attractions#browse-countries"
              className="block px-6 py-2 text-[14px] font-semibold text-[#60A5FA] hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              🌍 Browse Countries →
            </Link>
          </div>
          <Link href="/all-tickets" className="block px-4 py-3 text-[16px] font-semibold text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>All Tickets</Link>
          <Link href="/cities" className="block px-4 py-3 text-[16px] font-semibold text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>Cities</Link>
          <Link href="/planner" className="block px-4 py-3 text-[16px] font-semibold text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>✨ Planner</Link>
          <Link href="/cart" className="block px-4 py-3 text-[16px] font-semibold text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>
            Cart {cartBadge > 0 && `(${cartBadge})`}
          </Link>
          {user ? (
            <>
              <Link href="/mypage" className="block px-4 py-3 text-[16px] font-semibold text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>My Trips</Link>
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="block w-full text-left px-4 py-3 text-[16px] font-semibold text-[#EF4444]">Sign Out</button>
            </>
          ) : (
            <Link href="/login" className="block px-4 py-3 text-[16px] font-semibold text-[#DBEAFE] hover:text-white" onClick={() => setMobileOpen(false)}>Sign In</Link>
          )}
          <Link href="/sell" className="block mx-4 mt-2 px-4 py-3 text-center text-[16px] font-semibold text-white bg-[#2B7FFF] rounded-[8px]" onClick={() => setMobileOpen(false)}>Sell Tickets</Link>
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
