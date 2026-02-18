'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

const CITY_MAP: Record<string, { id: number; name: string; photo: string }> = {
  london:    { id: 67458,  name: 'London',    photo: 'photo-1513635269975-59663e0ac1ad' },
  paris:     { id: 66746,  name: 'Paris',     photo: 'photo-1502602898657-3e91760cbb34' },
  barcelona: { id: 66342,  name: 'Barcelona', photo: 'photo-1583422409516-2895a77efded' },
  rome:      { id: 71631,  name: 'Rome',      photo: 'photo-1552832230-c0197dd311b5'    },
  amsterdam: { id: 75061,  name: 'Amsterdam', photo: 'photo-1534351590666-13e3e96b5017' },
  dubai:     { id: 60005,  name: 'Dubai',     photo: 'photo-1512453979798-5ea266f8880c' },
  singapore: { id: 78125,  name: 'Singapore', photo: 'photo-1525625293386-3f8f99389edd' },
  prague:    { id: 64162,  name: 'Prague',    photo: 'photo-1541849546-216549ae216d'    },
  madrid:    { id: 66254,  name: 'Madrid',    photo: 'photo-1539037116277-4db20889f2d4' },
  vienna:    { id: 60335,  name: 'Vienna',    photo: 'photo-1516550893923-42d28e5677af' },
  'new-york': { id: 260932, name: 'New York', photo: 'photo-1496442226666-8d4d0e62e6e9' },
  tokyo:     { id: 72181,  name: 'Tokyo',     photo: 'photo-1540959733332-eab4deabeeaf' },
};

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
}

type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'rating';

function StarRating({ avg }: { avg: number }) {
  return (
    <span className="text-yellow-400 text-[13px]">
      {'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}
    </span>
  );
}

function ProductCard({ product, citySlug, cityPhoto }: { product: TiqetsProduct; citySlug: string; cityPhoto: string }) {
  const img = product.images?.[0];
  const imageUrl = img
    ? img
    : `https://images.unsplash.com/${cityPhoto}?w=400&h=300&fit=crop`;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:-translate-y-1 transition-transform overflow-hidden group flex flex-col">
      <Link href={`/attractions/${citySlug}/${product.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
          {product.promo_label && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {product.promo_label}
            </span>
          )}
          {product.skip_line && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Skip Line
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-[14px] font-semibold text-[#0F172A] line-clamp-2 mb-2 flex-1">
            {product.title}
          </h3>
          {product.ratings && product.ratings.total > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <StarRating avg={product.ratings.average} />
              <span className="text-[11px] text-[#64748B]">
                {product.ratings.average.toFixed(1)} ({product.ratings.total.toLocaleString()} reviews)
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-3">
            {product.duration && (
              <span>⏱ {product.duration}</span>
            )}
            {product.smartphone_ticket && (
              <span>📱 Mobile ticket</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {product.instant_ticket_delivery && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">✓ Instant</span>
            )}
            {product.cancellation && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">↩ Free Cancel</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-auto">
            <p className="text-[#2B7FFF] font-bold text-[16px]">
              From ${product.price?.toFixed(2) || '—'}
            </p>
            <span className="text-[13px] font-semibold text-[#FF6B35] hover:text-[#E55A25] transition-colors">
              Book Now →
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
      <div className="min-h-screen bg-[#F5F7FA]">
        <Header hideSearch />
        <div className="flex items-center justify-center h-64">
          <p className="text-[#64748B] text-[18px]">City not found.</p>
        </div>
      </div>
    );
  }

  const filtered = products.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'price_asc':  return (a.price || 0) - (b.price || 0);
      case 'price_desc': return (b.price || 0) - (a.price || 0);
      case 'rating':     return (b.ratings?.average || 0) - (a.ratings?.average || 0);
      default:           return (b.ratings?.total || 0) - (a.ratings?.total || 0);
    }
  });

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />

      {/* City Hero */}
      <section className="relative h-[280px] flex items-center">
        <Image
          src={`https://images.unsplash.com/${cityInfo.photo}?w=1600&h=600&fit=crop`}
          alt={cityInfo.name}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 text-white">
          <div className="text-[13px] mb-2 text-white/70">
            <Link href="/attractions" className="hover:text-white">Attractions</Link>
            <span className="mx-2">/</span>
            <span>{cityInfo.name}</span>
          </div>
          <h1 className="text-[42px] font-extrabold mb-2">{cityInfo.name}</h1>
          <p className="text-[16px] text-white/80">
            {loading ? '...' : `${products.length}+ Experiences Available`}
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#64748B] font-medium">Sort by:</span>
            {(['popular', 'price_asc', 'price_desc', 'rating'] as SortKey[]).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                  sort === s
                    ? 'bg-[#2B7FFF] text-white'
                    : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'
                }`}
              >
                {s === 'popular' ? 'Popular' : s === 'price_asc' ? 'Price ↑' : s === 'price_desc' ? 'Price ↓' : 'Rating'}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search experiences..."
                className="pl-9 pr-4 py-2 rounded-xl border border-[#E5E7EB] text-[13px] text-[#0F172A] outline-none focus:border-[#2B7FFF] transition-colors w-[220px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-[1280px] mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse h-[360px]" />
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <>
            <p className="text-[13px] text-[#64748B] mb-4">{sorted.length} experiences found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-xl bg-[#2B7FFF] text-white font-semibold text-[15px] hover:bg-[#1D6AE5] disabled:opacity-60 transition-colors"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-[#94A3B8] text-center py-20 text-[18px]">
            No experiences found for {cityInfo.name}.
          </p>
        )}
      </main>
    </div>
  );
}
