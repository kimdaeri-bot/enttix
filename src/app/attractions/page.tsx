'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const destinations = [
  { name: 'London',    slug: 'london',      photo: 'photo-1513635269975-59663e0ac1ad', count: 200 },
  { name: 'Paris',     slug: 'paris',       photo: 'photo-1502602898657-3e91760cbb34', count: 180 },
  { name: 'Barcelona', slug: 'barcelona',   photo: 'photo-1583422409516-2895a77efded', count: 150 },
  { name: 'Rome',      slug: 'rome',        photo: 'photo-1552832230-c0197dd311b5',    count: 160 },
  { name: 'Amsterdam', slug: 'amsterdam',   photo: 'photo-1534351590666-13e3e96b5017', count: 130 },
  { name: 'Dubai',     slug: 'dubai',       photo: 'photo-1512453979798-5ea266f8880c', count: 120 },
  { name: 'Singapore', slug: 'singapore',   photo: 'photo-1525625293386-3f8f99389edd', count: 110 },
  { name: 'Prague',    slug: 'prague',      photo: 'photo-1541849546-216549ae216d',    count: 100 },
  { name: 'Madrid',    slug: 'madrid',      photo: 'photo-1539037116277-4db20889f2d4', count: 90  },
  { name: 'Vienna',    slug: 'vienna',      photo: 'photo-1516550893923-42d28e5677af', count: 85  },
  { name: 'New York',  slug: 'new-york',    photo: 'photo-1496442226666-8d4d0e62e6e9', count: 220 },
  { name: 'Tokyo',     slug: 'tokyo',       photo: 'photo-1540959733332-eab4deabeeaf', count: 140 },
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
}

function StarRating({ avg }: { avg: number }) {
  return (
    <span className="text-yellow-400">
      {'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}
    </span>
  );
}

function ProductCard({ product }: { product: TiqetsProduct }) {
  const img = product.images?.[0];
  const fallbackCity = product.city_name?.toLowerCase() || 'london';
  const fallbackSlug = toSlug(fallbackCity);
  const fallbackDest = destinations.find(d => d.slug === fallbackSlug) || destinations[0];
  const imageUrl = img
    ? img
    : `https://images.unsplash.com/${fallbackDest.photo}?w=400&h=300&fit=crop`;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:-translate-y-1 transition-transform overflow-hidden group cursor-pointer">
      <Link href={`/attractions/${fallbackSlug}/${product.id}`} className="block">
        <div className="relative h-[180px] overflow-hidden">
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
        </div>
        <div className="p-3">
          <h3 className="text-[13px] font-semibold text-[#0F172A] line-clamp-2 mb-1">{product.title}</h3>
          {product.ratings && product.ratings.total > 0 && (
            <div className="flex items-center gap-1 mb-1">
              <StarRating avg={product.ratings.average} />
              <span className="text-[11px] text-[#64748B]">({product.ratings.total.toLocaleString()})</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1 mb-2">
            {product.instant_ticket_delivery && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">✓ Instant</span>
            )}
            {product.cancellation && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">↩ Free Cancel</span>
            )}
          </div>
          <p className="text-[#2B7FFF] font-bold text-[14px]">
            From ${product.price?.toFixed(2) || '—'}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function AttractionsPage() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<TiqetsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/tiqets/products?page_size=8')
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/attractions?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />

      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4"
        style={{
          height: 400,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
        }}
      >
        <h1 className="text-white text-[48px] font-extrabold leading-tight mb-3 tracking-tight">
          Discover Amazing Experiences
        </h1>
        <p className="text-[#94A3B8] text-[18px] mb-8">
          Book tickets, tours & attractions worldwide
        </p>
        <form onSubmit={handleSearch} className="w-full max-w-[560px]">
          <div className="relative flex items-center">
            <svg
              className="absolute left-4 text-[#94A3B8]"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search city or attraction..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-[#0F172A] text-[16px] shadow-xl outline-none border border-transparent focus:border-[#2B7FFF] transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-[#2B7FFF] text-white text-[14px] font-semibold hover:bg-[#1D6AE5] transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Popular Destinations */}
      <section className="max-w-[1280px] mx-auto px-4 py-14">
        <h2 className="text-[28px] font-bold text-[#0F172A] mb-2">Popular Destinations</h2>
        <p className="text-[#64748B] mb-8">Explore top cities around the world</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {destinations.map(dest => (
            <Link
              key={dest.slug}
              href={`/attractions/${dest.slug}`}
              className="group relative rounded-2xl overflow-hidden h-[180px] shadow-sm hover:-translate-y-1 transition-transform"
            >
              <Image
                src={`https://images.unsplash.com/${dest.photo}?w=400&h=300&fit=crop`}
                alt={dest.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-[18px] font-bold drop-shadow">{dest.name}</span>
                <span className="text-[12px] text-white/80 mt-1">{dest.count}+ Experiences</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Experiences */}
      <section className="max-w-[1280px] mx-auto px-4 pb-16">
        <h2 className="text-[28px] font-bold text-[#0F172A] mb-2">Trending Experiences</h2>
        <p className="text-[#64748B] mb-8">Handpicked top-rated attractions worldwide</p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse h-[280px]" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-[#94A3B8] text-center py-12">No trending experiences available right now.</p>
        )}
      </section>
    </div>
  );
}
