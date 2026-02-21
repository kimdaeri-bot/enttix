'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

/* ─────────────────────────────────────────
   Tiqets city IDs (from tiqets.com/en/city-cXX/ URL pattern)
───────────────────────────────────────── */
const CITIES = [
  { id: '',   name: 'All Cities',   flag: '🌍', slug: '' },
  { id: '24', name: 'London',       flag: '🇬🇧', slug: 'london' },
  { id: '30', name: 'Paris',        flag: '🇫🇷', slug: 'paris' },
  { id: '38', name: 'Barcelona',    flag: '🇪🇸', slug: 'barcelona' },
  { id: '12', name: 'Rome',         flag: '🇮🇹', slug: 'rome' },
  { id: '53', name: 'Amsterdam',    flag: '🇳🇱', slug: 'amsterdam' },
  { id: '39', name: 'New York',     flag: '🇺🇸', slug: 'new-york' },
  { id: '86', name: 'Dubai',        flag: '🇦🇪', slug: 'dubai' },
  { id: '77', name: 'Tokyo',        flag: '🇯🇵', slug: 'tokyo' },
  { id: '78', name: 'Singapore',    flag: '🇸🇬', slug: 'singapore' },
  { id: '71', name: 'Hong Kong',    flag: '🇭🇰', slug: 'hong-kong' },
  { id: '72', name: 'Istanbul',     flag: '🇹🇷', slug: 'istanbul' },
];

/* City 배경 이미지 (Unsplash) */
const CITY_IMG: Record<string, string> = {
  '24': 'photo-1513635269975-59663e0ac1ad',
  '30': 'photo-1502602898657-3e91760cbb34',
  '38': 'photo-1583422409516-2895a77efded',
  '12': 'photo-1552832230-c0197dd311b5',
  '53': 'photo-1534351590666-13e3e96b5017',
  '39': 'photo-1496442226666-8d4d0e62e6e9',
  '86': 'photo-1512453979798-5ea266f8880c',
  '77': 'photo-1540959733332-eab4deabeeaf',
  '78': 'photo-1525625293386-3f8f99389edd',
  '71': 'photo-1617788138017-80ad40651399',
  '72': 'photo-1541432901042-2d8bd64b4a9b',
};

/* 서브 카테고리 */
const CATEGORIES = [
  { key: '',           label: 'All Experiences', icon: '✨' },
  { key: 'museum',     label: 'Museums',          icon: '🏛️' },
  { key: 'tour',       label: 'Tours',            icon: '🗺️' },
  { key: 'outdoor',    label: 'Outdoor',          icon: '🌿' },
  { key: 'day trip',   label: 'Day Trips',        icon: '🚌' },
  { key: 'show',       label: 'Performing Arts',  icon: '🎭' },
  { key: 'food',       label: 'Food & Drink',     icon: '🍽️' },
  { key: 'art',        label: 'Art & Culture',    icon: '🎨' },
  { key: 'skip the line', label: 'Skip the Line', icon: '⚡' },
  { key: 'cruise',     label: 'Cruises',          icon: '🚢' },
  { key: 'night',      label: 'Nightlife',        icon: '🌙' },
];

/* Tiqets 제품 타입 */
interface TiqetsProduct {
  id: number;
  title: string;
  images?: string[];
  price?: number;
  ratings?: { total: number; average: number };
  promo_label?: string;
  instant_ticket_delivery?: boolean;
  skip_line?: boolean;
  duration?: string;
  city_name?: string;
  product_url?: string;
  cancellation?: string;
}

/* 도시별 Unsplash 폴백 */
function getCityFallback(cityId: string) {
  const photo = CITY_IMG[cityId] || 'photo-1502602898657-3e91760cbb34';
  return `https://images.unsplash.com/${photo}?w=800&h=600&fit=crop`;
}

function StarRating({ avg }: { avg: number }) {
  const full = Math.round(avg);
  return (
    <span className="text-amber-400 text-[12px]">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

function ProductCard({ product, cityId }: { product: TiqetsProduct; cityId: string }) {
  const [imgSrc, setImgSrc] = useState<string>(
    product.images?.[0] || getCityFallback(cityId)
  );
  const outLink = product.product_url || 'https://www.tiqets.com/en/';

  return (
    <a
      href={outLink}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all duration-200 flex flex-col"
    >
      {/* 이미지 */}
      <div className="relative aspect-[16/9] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgSrc(getCityFallback(cityId))}
        />
        {/* 배지 */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.promo_label === 'bestseller' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-[#FF6B35]">
              🏆 Bestseller
            </span>
          )}
          {product.skip_line && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-green-500">
              ⚡ Skip Line
            </span>
          )}
          {product.instant_ticket_delivery && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-[#2B7FFF]">
              ✓ Instant
            </span>
          )}
        </div>
        {/* 도시 태그 */}
        {product.city_name && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm">
              {product.city_name}
            </span>
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[14px] font-bold text-[#171717] leading-[20px] mb-2 line-clamp-2 group-hover:text-[#2B7FFF] transition-colors">
          {product.title}
        </h3>

        <div className="flex flex-col gap-1 mb-3 flex-1">
          {product.ratings && product.ratings.total > 0 && (
            <div className="flex items-center gap-1">
              <StarRating avg={product.ratings.average} />
              <span className="text-[11px] text-[#6B7280]">
                {product.ratings.average.toFixed(1)} ({product.ratings.total.toLocaleString()})
              </span>
            </div>
          )}
          {product.duration && (
            <p className="text-[12px] text-[#6B7280]">⏱ {product.duration}</p>
          )}
          {product.cancellation && (
            <p className="text-[12px] text-green-600">↩️ {product.cancellation}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-[14px] font-bold text-[#171717]">
            {product.price && product.price > 0
              ? `From $${Math.round(product.price)}`
              : 'See prices'}
          </span>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#2B7FFF] group-hover:gap-2 transition-all">
            Book Now
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}

/* ─────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────── */
export default function AttractionsPage() {
  const [activeCity, setActiveCity] = useState('24'); // 기본: London
  const [activeCategory, setActiveCategory] = useState('');
  const [products, setProducts] = useState<TiqetsProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const PAGE_SIZE = 20;

  const fetchProducts = useCallback(async (cityId: string, category: string, page: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page_size: String(PAGE_SIZE),
        page: String(page),
      });
      if (cityId) params.set('city_id', cityId);
      if (category) params.set('query', category);

      const res = await fetch(`/api/tiqets/products?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setProducts(data.products || []);
      const total = data.total_results || data.count || (data.products?.length || 0);
      setTotalCount(total);
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    } catch (e) {
      setError('어트랙션을 불러오는데 실패했습니다.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(activeCity, activeCategory, 1);
  }, [activeCity, activeCategory, fetchProducts]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(activeCity, activeCategory, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCityObj = CITIES.find(c => c.id === activeCity) || CITIES[0];
  const activeCatObj  = CATEGORIES.find(c => c.key === activeCategory) || CATEGORIES[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />

      {/* ── 히어로 ── */}
      <div className="bg-[#0F172A]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-10 pb-0">
          {/* 브레드크럼 */}
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-[12px] font-bold text-[#2B7FFF] tracking-[1.5px] hover:text-[#60A5FA]">HOME</Link>
            <span className="text-[12px] text-[#475569]">·</span>
            <span className="text-[12px] text-[#475569]">ATTRACTIONS</span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-extrabold text-white tracking-[-1px] mb-2">
            Attractions & Experiences
          </h1>
          <p className="text-[14px] text-[#94A3B8] mb-6">
            200+ Destinations · Powered by Tiqets — Instant ticket delivery
          </p>
        </div>

        {/* 카테고리 탭 (히어로 하단, 서브카테고리 역할) */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {CATEGORIES.slice(0, 6).map(cat => (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setCurrentPage(1); }}
                className={`flex-shrink-0 px-5 py-3 text-[14px] font-semibold rounded-t-[10px] transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-[#F5F7FA] text-[#171717]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky 도시 필터 바 ── */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {CITIES.map(city => (
              <button
                key={city.id}
                onClick={() => { setActiveCity(city.id); setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  activeCity === city.id
                    ? 'bg-[#2B7FFF] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'
                }`}
              >
                <span className="text-[14px]">{city.flag}</span>
                <span>{city.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 서브카테고리 필터 바 ── */}
      <div className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all border ${
                  activeCategory === cat.key
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                    : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30 hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="text-[15px]">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 컨텐츠 영역 ── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">

        {/* 상단 정보 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-[13px] text-[#6B7280]">
            {!loading && (
              <>
                <span className="font-semibold text-[#171717]">
                  {activeCityObj.flag} {activeCityObj.name}
                </span>
                {activeCategory && (
                  <> · <span className="font-semibold text-[#171717]">{activeCatObj.label}</span></>
                )}
                {totalCount > 0 && (
                  <> · 총 <span className="font-semibold text-[#171717]">{totalCount.toLocaleString()}</span>개</>
                )}
                {totalPages > 1 && (
                  <> · 페이지 <span className="font-semibold text-[#171717]">{currentPage}</span> / {totalPages}</>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
            <span>Powered by</span>
            <a
              href="https://www.tiqets.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#E84343] hover:underline"
            >
              Tiqets
            </a>
          </div>
        </div>

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] animate-pulse">
                <div className="aspect-[16/9] bg-[#E5E7EB]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#E5E7EB] rounded w-3/4" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-1/2" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="text-center py-20 text-[#EF4444]">{error}</div>
        )}

        {/* 제품 그리드 */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} cityId={activeCity} />
            ))}
          </div>
        )}

        {/* 빈 결과 */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[48px] mb-4">🎟️</p>
            <p className="text-[#374151] font-semibold text-[16px] mb-2">이 도시의 어트랙션이 없습니다</p>
            <p className="text-[#94A3B8] text-[13px]">다른 도시나 카테고리를 선택해보세요</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[12px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              «
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-[8px] text-[13px] font-semibold transition-colors ${
                    p === currentPage
                      ? 'bg-[#2B7FFF] text-white'
                      : 'border border-[#E5E7EB] text-[#374151] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className="px-3 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[12px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
