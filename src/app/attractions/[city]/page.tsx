'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

const CITY_MAP: Record<string, { id: number; name: string; photo: string; desc: string }> = {
  london:    { id: 67458,  name: 'London',    photo: 'photo-1513635269975-59663e0ac1ad', desc: 'Explore the Tower of London, royal palaces, world-class museums and iconic landmarks.' },
  paris:     { id: 66746,  name: 'Paris',     photo: 'photo-1502602898657-3e91760cbb34', desc: 'Climb the Eiffel Tower, visit the Louvre and stroll along the Champs-Élysées.' },
  barcelona: { id: 66342,  name: 'Barcelona', photo: 'photo-1583422409516-2895a77efded', desc: "Discover Gaudí's masterpieces, beautiful beaches and vibrant Catalan culture." },
  rome:      { id: 71631,  name: 'Rome',      photo: 'photo-1552832230-c0197dd311b5',    desc: 'Walk through 2,500 years of history in the Colosseum, Vatican and beyond.' },
  amsterdam: { id: 75061,  name: 'Amsterdam', photo: 'photo-1534351590666-13e3e96b5017', desc: 'Cruise the canals, visit the Rijksmuseum and discover world-famous art.' },
  dubai:     { id: 60005,  name: 'Dubai',     photo: 'photo-1512453979798-5ea266f8880c', desc: 'Soar to the top of the Burj Khalifa, explore desert dunes and luxury experiences.' },
  singapore: { id: 78125,  name: 'Singapore', photo: 'photo-1525625293386-3f8f99389edd', desc: 'From Gardens by the Bay to Sentosa Island — a city full of surprises.' },
  prague:    { id: 64162,  name: 'Prague',    photo: 'photo-1541849546-216549ae216d',    desc: 'Wander the cobblestone streets, cross Charles Bridge and visit Prague Castle.' },
  madrid:    { id: 66254,  name: 'Madrid',    photo: 'photo-1539037116277-4db20889f2d4', desc: 'World-class art, tapas culture and the grandeur of the Prado Museum.' },
  vienna:    { id: 60335,  name: 'Vienna',    photo: 'photo-1516550893923-42d28e5677af', desc: 'Imperial palaces, classical music and the finest coffee house culture in Europe.' },
  'new-york': { id: 260932, name: 'New York', photo: 'photo-1496442226666-8d4d0e62e6e9', desc: 'From the Statue of Liberty to Broadway — the city that never sleeps.' },
  tokyo:     { id: 72181,  name: 'Tokyo',     photo: 'photo-1540959733332-eab4deabeeaf', desc: 'Ancient temples, futuristic technology and endless culinary adventures.' },
};

// Category filter chips with Tiqets tag IDs
const CATEGORIES = [
  { label: 'All',             tagId: null,  icon: '✨' },
  { label: 'Museums',         tagId: 1363,  icon: '🏛️' },
  { label: 'Skip the Line',   tagId: 1711,  icon: '⚡' },
  { label: 'Day Trips',       tagId: 1385,  icon: '🚌' },
  { label: 'Tours',           tagId: null,  icon: '🗺️', key: 'tours' },
  { label: 'Outdoor',         tagId: 1191,  icon: '🌿' },
  { label: 'Food & Drink',    tagId: 962,   icon: '🍽️' },
  { label: 'Performing Arts', tagId: 665,   icon: '🎭' },
];

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
}

type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'rating';

function StarRating({ avg }: { avg: number }) {
  const full = Math.round(avg);
  return (
    <span className="text-amber-400 text-[12px] leading-none">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

function ProductCard({
  product,
  citySlug,
  cityPhoto,
}: {
  product: TiqetsProduct;
  citySlug: string;
  cityPhoto: string;
}) {
  const fallbackUrl = `https://images.unsplash.com/${cityPhoto}?w=500&h=375&fit=crop`;
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
        .then(data => {
          setImageUrl(data.imageUrl || fallbackUrl);
        })
        .catch(() => setImageUrl(fallbackUrl))
        .finally(() => setImgLoading(false));
    } else {
      setImageUrl(fallbackUrl);
      setImgLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBestseller = product.promo_label === 'bestseller';
  const isSkipLine = product.skip_line || product.tag_ids?.includes(1711);
  const hasFreeCancel = !!product.cancellation;
  const priceInt = Math.round(product.price || 0);

  return (
    <div className="bg-white rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <Link href={`/attractions/${citySlug}/${product.id}`} className="flex flex-col flex-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 flex-shrink-0">
          {imgLoading ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]" />
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          ) : null}

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isBestseller && (
              <span className="bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow">
                🏆 Bestseller
              </span>
            )}
            {isSkipLine && (
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                ⚡ Skip Line
              </span>
            )}
            {hasFreeCancel && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                ↩ Free Cancel
              </span>
            )}
          </div>
          {product.instant_ticket_delivery && (
            <span className="absolute top-2 right-2 bg-[#2B7FFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              ✓ Instant
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-[14px] font-semibold text-[#0F172A] line-clamp-2 mb-2 leading-snug flex-1">
            {product.title}
          </h3>

          {/* Rating */}
          {product.ratings && product.ratings.total > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <StarRating avg={product.ratings.average} />
              <span className="text-[11px] text-[#64748B]">
                {product.ratings.average.toFixed(1)}
                <span className="text-[#94A3B8] ml-0.5">
                  ({product.ratings.total.toLocaleString()})
                </span>
              </span>
            </div>
          )}

          {/* Duration */}
          {product.duration && (
            <p className="text-[11px] text-[#94A3B8] mb-3">⏱ {product.duration}</p>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F1F5F9]">
            <div>
              <p className="text-[11px] text-[#94A3B8]">From</p>
              <p className="text-[16px] font-extrabold text-[#0F172A]">${priceInt}</p>
            </div>
            <span className="text-[12px] font-semibold text-[#2B7FFF]">
              Book now →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function CityAttractionsPage() {
  const params = useParams();
  const citySlug = params.city as string;
  const cityInfo = CITY_MAP[citySlug];

  const [products, setProducts] = useState<TiqetsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null | 'tours'>(null);

  const fetchProducts = useCallback(async (pageNum: number, append = false) => {
    if (!cityInfo) return;
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(
        `/api/tiqets/products?city_id=${cityInfo.id}&page=${pageNum}&page_size=24`
      );
      const data = await res.json();
      const newProducts: TiqetsProduct[] = data.products || [];
      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
      setHasMore(newProducts.length === 24);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cityInfo]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, true);
  };

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

  // Filter by category
  let filtered = products.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeCategory !== null) {
    if (activeCategory === 'tours') {
      // Tours: no specific tag, just filter by name keyword
      filtered = filtered.filter(p => p.title.toLowerCase().includes('tour'));
    } else if (activeCategory === 1711) {
      // Skip the Line: tag OR skip_line flag
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

  return (
    <div className="min-h-screen bg-white">
      <Header hideSearch />

      {/* City Hero */}
      <section className="relative h-[300px] flex items-end pb-8">
        <Image
          src={`https://images.unsplash.com/${cityInfo.photo}?w=1600&h=600&fit=crop`}
          alt={cityInfo.name}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 text-white w-full">
          <div className="text-[12px] mb-2 text-white/60 flex items-center gap-1">
            <Link href="/attractions" className="hover:text-white transition-colors">Attractions</Link>
            <span>/</span>
            <span className="text-white/90">{cityInfo.name}</span>
          </div>
          <h1 className="text-[44px] font-extrabold mb-2 leading-tight">
            {cityInfo.name}
          </h1>
          <p className="text-[15px] text-white/75 max-w-[600px]">
            {cityInfo.desc}
          </p>
        </div>
      </section>

      {/* Category Filters + Sort Bar */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4">
          {/* Category chips */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            {CATEGORIES.map(cat => {
              const isActive = cat.tagId === activeCategory || (cat.key === 'tours' && activeCategory === 'tours');
              return (
                <button
                  key={cat.label}
                  onClick={() => {
                    if (cat.key === 'tours') setActiveCategory('tours');
                    else setActiveCategory(cat.tagId);
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
            <p className="text-[13px] text-[#64748B]">
              {loading ? 'Loading...' : `${sorted.length} experience${sorted.length !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-2">
              {/* Search input */}
              <div className="relative hidden sm:block">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[12px] text-[#0F172A] outline-none focus:border-[#2B7FFF] transition-colors w-[160px]"
                />
              </div>
              {/* Sort */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="text-[12px] font-semibold text-[#374151] border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none focus:border-[#2B7FFF] cursor-pointer bg-white"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-[1280px] mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                  <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sorted.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  citySlug={citySlug}
                  cityPhoto={cityInfo.photo}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-10 py-3.5 rounded-xl bg-[#0F172A] text-white font-semibold text-[15px] hover:bg-[#1E293B] disabled:opacity-60 transition-colors"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : 'Load More Experiences'}
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
      </main>
    </div>
  );
}
