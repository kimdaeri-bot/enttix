'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

/* ─── CITY MAP ──────────────────────────────────────────────── */
const CITY_MAP: Record<string, {
  id: number;
  name: string;
  tiqetsSlug: string;
  photo: string;
  desc: string;
}> = {
  london:     { id: 67458,  name: 'London',    tiqetsSlug: 'london-attractions-c67458',     photo: 'photo-1513635269975-59663e0ac1ad', desc: 'Explore the Tower of London, royal palaces, world-class museums and iconic landmarks.' },
  paris:      { id: 66746,  name: 'Paris',     tiqetsSlug: 'paris-attractions-c66746',      photo: 'photo-1502602898657-3e91760cbb34', desc: 'Climb the Eiffel Tower, visit the Louvre and stroll along the Champs-Élysées.' },
  barcelona:  { id: 66342,  name: 'Barcelona', tiqetsSlug: 'barcelona-attractions-c66342',  photo: 'photo-1583422409516-2895a77efded', desc: "Discover Gaudí's masterpieces, beautiful beaches and vibrant Catalan culture." },
  rome:       { id: 71631,  name: 'Rome',      tiqetsSlug: 'rome-attractions-c71631',       photo: 'photo-1552832230-c0197dd311b5',    desc: 'Walk through 2,500 years of history in the Colosseum, Vatican and beyond.' },
  amsterdam:  { id: 75061,  name: 'Amsterdam', tiqetsSlug: 'amsterdam-attractions-c75061',  photo: 'photo-1534351590666-13e3e96b5017', desc: 'Cruise the canals, visit the Rijksmuseum and discover world-famous art.' },
  dubai:      { id: 60005,  name: 'Dubai',     tiqetsSlug: 'dubai-attractions-c60005',      photo: 'photo-1512453979798-5ea266f8880c', desc: 'Soar to the top of the Burj Khalifa, explore desert dunes and luxury experiences.' },
  singapore:  { id: 78125,  name: 'Singapore', tiqetsSlug: 'singapore-attractions-c78125',  photo: 'photo-1525625293386-3f8f99389edd', desc: 'From Gardens by the Bay to Sentosa Island — a city full of surprises.' },
  prague:     { id: 64162,  name: 'Prague',    tiqetsSlug: 'prague-attractions-c64162',     photo: 'photo-1541849546-216549ae216d',    desc: 'Wander the cobblestone streets, cross Charles Bridge and visit Prague Castle.' },
  madrid:     { id: 66254,  name: 'Madrid',    tiqetsSlug: 'madrid-attractions-c66254',     photo: 'photo-1539037116277-4db20889f2d4', desc: 'World-class art, tapas culture and the grandeur of the Prado Museum.' },
  vienna:     { id: 60335,  name: 'Vienna',    tiqetsSlug: 'vienna-attractions-c60335',     photo: 'photo-1516550893923-42d28e5677af', desc: 'Imperial palaces, classical music and the finest coffee house culture in Europe.' },
  'new-york': { id: 260932, name: 'New York',  tiqetsSlug: 'new-york-attractions-c260932',  photo: 'photo-1496442226666-8d4d0e62e6e9', desc: 'From the Statue of Liberty to Broadway — the city that never sleeps.' },
  tokyo:      { id: 72181,  name: 'Tokyo',     tiqetsSlug: 'tokyo-attractions-c72181',      photo: 'photo-1540959733332-eab4deabeeaf', desc: 'Ancient temples, futuristic technology and endless culinary adventures.' },
};

/* ─── CATEGORIES ────────────────────────────────────────────── */
const CATEGORIES = [
  { label: 'All',             tagId: null  as number | null, icon: '✨' },
  { label: 'Museums',         tagId: 1363,  icon: '🏛️' },
  { label: 'Skip Line',       tagId: 1711,  icon: '⚡' },
  { label: 'Tours',           tagId: null,  icon: '🗺️', key: 'tours' },
  { label: 'Day Trips',       tagId: 1385,  icon: '🚌' },
  { label: 'Outdoor',         tagId: 1191,  icon: '🌿' },
  { label: 'Food & Drink',    tagId: 962,   icon: '🍽️' },
  { label: 'Performing Arts', tagId: 665,   icon: '🎭' },
];

const AUDIENCE_CHIPS = [
  { icon: '👫', label: 'Couples' },
  { icon: '👨‍👩‍👧', label: 'Families' },
  { icon: '🧍', label: 'Solo' },
  { icon: '👥', label: 'Friends' },
  { icon: '🎒', label: 'Backpackers' },
];

/* ─── TYPES ─────────────────────────────────────────────────── */
interface TiqetsProduct {
  id: number;
  title: string;
  tagline?: string;
  summary?: string;
  images?: string[];
  price?: number;
  ratings?: { total: number; average: number };
  promo_label?: string;
  instant_ticket_delivery?: boolean;
  cancellation?: string;
  duration?: string;
  skip_line?: boolean;
  smartphone_ticket?: boolean;
  city_name?: string;
  product_checkout_url?: string;
  product_url?: string;
  tag_ids?: number[];
  venue?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'rating';
type CategoryFilter = number | null | 'tours';

/* ─── SKELETON ───────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse mt-2" />
      </div>
    </div>
  );
}

/* ─── TOP10 CARD ─────────────────────────────────────────────── */
function Top10Card({
  product,
  index,
  citySlug,
  fallbackPhoto,
}: {
  product: TiqetsProduct;
  index: number;
  citySlug: string;
  fallbackPhoto: string;
}) {
  const fallback = `https://images.unsplash.com/${fallbackPhoto}?w=560&h=420&fit=crop`;
  const img = product.images?.[0] || fallback;
  const avg = product.ratings?.average ?? 0;
  const price = Math.floor(product.price || 0);

  return (
    <Link
      href={`/attractions/${citySlug}/${product.id}`}
      className="group flex-shrink-0 w-[260px] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={img}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
        {/* Number badge */}
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-[#2B7FFF] text-white font-extrabold text-[15px] flex items-center justify-center shadow-md">
          {index + 1}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-[#0F172A] line-clamp-2 mb-1.5 leading-snug">
          {product.title}
        </h3>
        {avg > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-yellow-400 text-[12px]">★</span>
            <span className="text-[12px] font-semibold text-[#0F172A]">{avg.toFixed(1)}</span>
            <span className="text-[11px] text-[#64748B]">({(product.ratings?.total ?? 0).toLocaleString()})</span>
          </div>
        )}
        {price > 0 && (
          <p className="text-[13px] font-bold text-[#0F172A]">From ${price}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── PRODUCT CARD ───────────────────────────────────────────── */
function ProductCard({
  product,
  citySlug,
  fallbackPhoto,
}: {
  product: TiqetsProduct;
  citySlug: string;
  fallbackPhoto: string;
}) {
  const fallback = `https://images.unsplash.com/${fallbackPhoto}?w=560&h=420&fit=crop`;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (product.images && product.images.length > 0) {
      setImageUrl(product.images[0]);
      setImgLoading(false);
      return;
    }
    if (product.product_url) {
      fetch(`/api/tiqets/product-image?product_url=${encodeURIComponent(product.product_url)}`)
        .then(r => r.json())
        .then(d => setImageUrl(d.imageUrl || fallback))
        .catch(() => setImageUrl(fallback))
        .finally(() => setImgLoading(false));
    } else {
      setImageUrl(fallback);
      setImgLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBestseller = product.promo_label === 'bestseller';
  const isSkipLine = product.skip_line || product.tag_ids?.includes(1711);
  const price = Math.floor(product.price || 0);
  const avg = product.ratings?.average ?? 0;
  const total = product.ratings?.total ?? 0;

  return (
    <Link
      href={`/attractions/${citySlug}/${product.id}`}
      className="group cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {imgLoading ? (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : null}
        {isBestseller && (
          <span className="absolute top-2 left-2 bg-[#FF6B35] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
            Bestseller
          </span>
        )}
        {isSkipLine && (
          <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded">
            Skip Line
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-[14px] font-semibold text-[#0F172A] line-clamp-2 mb-1.5 leading-snug flex-1">
          {product.title}
        </h3>
        {avg > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-yellow-400 text-[13px]">★</span>
            <span className="text-[13px] font-semibold text-[#0F172A]">{avg.toFixed(1)}</span>
            <span className="text-[12px] text-[#64748B]">({total.toLocaleString()})</span>
          </div>
        )}
        {product.duration && (
          <p className="text-[12px] text-[#64748B] mb-1.5">⏱ {product.duration}</p>
        )}
        {price > 0 && (
          <p className="text-[15px] font-bold text-[#0F172A] mt-auto">From ${price}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── VENUE CARD ─────────────────────────────────────────────── */
function VenueCard({
  name,
  address,
  count,
  cityPhoto,
}: {
  name: string;
  address?: string;
  count: number;
  cityPhoto: string;
}) {
  const fallback = `https://images.unsplash.com/${cityPhoto}?w=400&h=300&fit=crop`;
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image src={fallback} alt={name} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 text-white">
          <p className="text-[13px] font-bold leading-tight line-clamp-2">{name}</p>
          <p className="text-[11px] text-white/75">{count} experience{count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {address && (
        <div className="px-3 py-2">
          <p className="text-[11px] text-[#64748B] line-clamp-1">📍 {address}</p>
        </div>
      )}
    </div>
  );
}

/* ─── PAGE ───────────────────────────────────────────────────── */
export default function CityAttractionsPage() {
  const params = useParams();
  const citySlug = params.city as string;
  const cityInfo = CITY_MAP[citySlug];

  const [products, setProducts] = useState<TiqetsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(24);
  const [sort, setSort] = useState<SortKey>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(null);

  const fetchProducts = useCallback(async () => {
    if (!cityInfo) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tiqets/city-with-images?city_id=${cityInfo.id}&city_url=${encodeURIComponent(cityInfo.tiqetsSlug)}`
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [cityInfo]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ─── Filter & sort ───────────────────── */
  let filtered = products.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (activeCategory !== null) {
    if (activeCategory === 'tours') {
      filtered = filtered.filter(p => p.title.toLowerCase().includes('tour'));
    } else if (activeCategory === 1711) {
      filtered = filtered.filter(p => p.skip_line || p.tag_ids?.includes(1711));
    } else {
      filtered = filtered.filter(p => p.tag_ids?.includes(activeCategory as number));
    }
  }
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'price_asc':  return (a.price || 0) - (b.price || 0);
      case 'price_desc': return (b.price || 0) - (a.price || 0);
      case 'rating':     return (b.ratings?.average || 0) - (a.ratings?.average || 0);
      default:           return (b.ratings?.total || 0) - (a.ratings?.total || 0);
    }
  });

  /* ─── Top 10 (rating sorted, best first) ─ */
  const top10 = [...products]
    .sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0))
    .slice(0, 10);

  /* ─── Points of Interest (venues) ────────── */
  const venueMap = new Map<string, { address?: string; count: number }>();
  products.forEach(p => {
    const vName = p.venue?.name;
    if (!vName) return;
    const existing = venueMap.get(vName);
    if (existing) existing.count++;
    else venueMap.set(vName, { address: p.venue?.address, count: 1 });
  });
  const venues = [...venueMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const displayed = sorted.slice(0, displayCount);
  const hasMore = displayed.length < sorted.length;

  if (!cityInfo) {
    return (
      <div className="min-h-screen bg-white">
        <Header hideSearch />
        <div className="flex items-center justify-center h-64">
          <p className="text-[#64748B] text-[18px]">City not found.</p>
        </div>
      </div>
    );
  }

  const heroUrl = `https://images.unsplash.com/${cityInfo.photo}?w=1600&h=800&fit=crop`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header hideSearch />

      {/* ─── 1. HERO ──────────────────────────────────────── */}
      <section className="relative h-[400px] flex flex-col justify-end pb-10">
        <Image src={heroUrl} alt={cityInfo.name} fill className="object-cover" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-3">
            <Link href="/attractions" className="hover:text-white transition-colors">Attractions</Link>
            <span>›</span>
            <span className="text-white/90">{cityInfo.name}</span>
          </div>
          {/* H1 */}
          <h1 className="text-[42px] sm:text-[52px] font-extrabold text-white mb-2 leading-tight">
            Things to do in {cityInfo.name}
          </h1>
          <p className="text-white/75 text-[15px] mb-6">
            {products.length > 0 ? `${products.length}+` : '100+'} Experiences · Skip the Line · Book Online
          </p>
          {/* Search bar */}
          <div className="relative max-w-[520px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search experiences in ${cityInfo.name}...`}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-[#0F172A] text-[15px] outline-none shadow-lg placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2B7FFF]"
            />
          </div>
        </div>
      </section>

      {/* ─── 2. TOP 10 ────────────────────────────────────── */}
      {!loading && top10.length > 0 && (
        <section className="bg-white py-10 border-b border-[#E5E7EB]">
          <div className="max-w-[1280px] mx-auto px-4">
            <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
              Top 10 things to do in {cityInfo.name}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
              {top10.map((p, i) => (
                <Top10Card
                  key={p.id}
                  product={p}
                  index={i}
                  citySlug={citySlug}
                  fallbackPhoto={cityInfo.photo}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 3. RECOMMENDED FOR ───────────────────────────── */}
      <section className="bg-white py-8 border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
            Experiences in {cityInfo.name} recommended for
          </h2>
          <div className="flex flex-wrap gap-3">
            {AUDIENCE_CHIPS.map(chip => (
              <div
                key={chip.label}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#374151] text-[14px] font-semibold cursor-pointer hover:border-[#2B7FFF] hover:text-[#2B7FFF] transition-colors select-none"
              >
                <span className="text-[18px]">{chip.icon}</span>
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. FILTER BAR (sticky) ────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4">
          {/* Category chips */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            {CATEGORIES.map(cat => {
              const isActive =
                (cat.key === 'tours' && activeCategory === 'tours') ||
                (!cat.key && cat.tagId === activeCategory);
              return (
                <button
                  key={cat.label}
                  onClick={() => {
                    if (cat.key === 'tours') setActiveCategory('tours');
                    else setActiveCategory(cat.tagId);
                    setDisplayCount(24);
                  }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort row */}
          <div className="flex items-center justify-between py-2 border-t border-[#F1F5F9]">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#0F172A] inline mr-3">
                All experiences in {cityInfo.name}
              </h2>
              <span className="text-[13px] text-[#64748B]">
                {loading ? 'Loading…' : `${sorted.length} experiences found`}
              </span>
            </div>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value as SortKey); setDisplayCount(24); }}
              className="text-[12px] font-semibold text-[#374151] border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none focus:border-[#2B7FFF] cursor-pointer bg-white"
            >
              <option value="popular">Popular</option>
              <option value="rating">Rating</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 5. MAIN GRID ──────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : sorted.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayed.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  citySlug={citySlug}
                  fallbackPhoto={cityInfo.photo}
                />
              ))}
            </div>

            {/* ─── 6. LOAD MORE ─────────────────────────── */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setDisplayCount(c => c + 24)}
                  className="px-10 py-3.5 rounded-xl bg-[#0F172A] text-white font-semibold text-[15px] hover:bg-[#1E293B] transition-colors"
                >
                  Load More Experiences
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#94A3B8] text-[18px] mb-3">No experiences found</p>
            <button
              onClick={() => { setActiveCategory(null); setSearchQuery(''); }}
              className="text-[#2B7FFF] text-[14px] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ─── 7. POINTS OF INTEREST ───────────────────────── */}
        {!loading && venues.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
              Points of interest in {cityInfo.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {venues.map(([name, info]) => (
                <VenueCard
                  key={name}
                  name={name}
                  address={info.address}
                  count={info.count}
                  cityPhoto={cityInfo.photo}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
