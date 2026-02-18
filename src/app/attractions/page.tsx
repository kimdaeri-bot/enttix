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

const popularCategories = [
  { icon: '🏛️', name: 'Museums',         slug: 'museums'    },
  { icon: '⚡', name: 'Skip the Line',   slug: 'skip-line'  },
  { icon: '🚌', name: 'Day Trips',        slug: 'day-trips'  },
  { icon: '🌿', name: 'Outdoor',          slug: 'outdoor'    },
  { icon: '🎭', name: 'Performing Arts',  slug: 'performing' },
  { icon: '🍽️', name: 'Food & Drink',    slug: 'food-drink' },
  { icon: '🗺️', name: 'Tours',           slug: 'tours'      },
  { icon: '🎨', name: 'Art & Culture',   slug: 'art'        },
];

const whyEnttix = [
  {
    icon: '✅',
    title: 'Instant Confirmation',
    desc: 'Get your tickets instantly — no waiting, no hassle.',
  },
  {
    icon: '↩️',
    title: 'Free Cancellation',
    desc: 'Change of plans? Cancel for free up to 24 hours before.',
  },
  {
    icon: '🔒',
    title: 'Secure Booking',
    desc: 'Your payment is fully protected with SSL encryption.',
  },
  {
    icon: '🌍',
    title: '200+ Destinations',
    desc: 'Thousands of experiences across 200+ cities worldwide.',
  },
];

interface TiqetsProduct {
  id: number;
  title: string;
  images?: string[];
  price?: number;
  ratings?: { total: number; average: number };
  promo_label?: string;
  instant_ticket_delivery?: boolean;
  cancellation?: string;
  duration?: string;
  skip_line?: boolean;
  city_name?: string;
  product_url?: string;
}

function StarRating({ avg }: { avg: number }) {
  return (
    <span className="text-amber-400 text-[13px]">
      {'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}
    </span>
  );
}

function ProductCard({ product }: { product: TiqetsProduct }) {
  const fallbackCity = product.city_name?.toLowerCase() || 'london';
  const fallbackSlug = toSlug(fallbackCity);
  const fallbackDest = destinations.find(d => d.slug === fallbackSlug) || destinations[0];
  const fallbackUrl = `https://images.unsplash.com/${fallbackDest.photo}?w=400&h=300&fit=crop`;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
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
          setImgLoading(false);
        })
        .catch(() => {
          setImageUrl(fallbackUrl);
          setImgLoading(false);
        });
    } else {
      setImageUrl(fallbackUrl);
      setImgLoading(false);
    }
  }, [product.product_url, product.images, fallbackUrl]);

  return (
    <div className="bg-white rounded-xl overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
      <Link href={`/attractions/${fallbackSlug}/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {imgLoading ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          ) : null}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.promo_label === 'bestseller' && (
              <span className="bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                🏆 Bestseller
              </span>
            )}
            {product.skip_line && (
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ⚡ Skip Line
              </span>
            )}
            {product.instant_ticket_delivery && (
              <span className="bg-[#2B7FFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✓ Instant
              </span>
            )}
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-[13px] font-semibold text-[#0F172A] line-clamp-2 mb-1.5 leading-snug">
            {product.title}
          </h3>
          {product.ratings && product.ratings.total > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <StarRating avg={product.ratings.average} />
              <span className="text-[11px] text-[#64748B]">
                {product.ratings.average.toFixed(1)} ({product.ratings.total.toLocaleString()})
              </span>
            </div>
          )}
          {product.duration && (
            <p className="text-[11px] text-[#94A3B8] mb-1.5">⏱ {product.duration}</p>
          )}
          <p className="text-[#0F172A] font-bold text-[14px]">
            From ${Math.round(product.price || 0)}
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
    <div className="min-h-screen bg-white">
      <Header hideSearch />

      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4"
        style={{
          minHeight: 440,
          background: 'linear-gradient(135deg, #0F172A 0%, #1a2f5a 60%, #2B7FFF 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#2B7FFF]/10 blur-2xl" />
        <div className="absolute bottom-10 right-16 w-48 h-48 rounded-full bg-[#FF6B35]/10 blur-3xl" />

        <p className="text-[#FF6B35] font-semibold text-[14px] tracking-widest uppercase mb-3">
          Explore the World
        </p>
        <h1 className="text-white text-[52px] font-extrabold leading-tight mb-4 tracking-tight max-w-[720px]">
          Discover Amazing<br />Experiences
        </h1>
        <p className="text-[#94A3B8] text-[18px] mb-10 max-w-[480px]">
          Book tickets, tours & attractions worldwide — instantly confirmed
        </p>
        <form onSubmit={handleSearch} className="w-full max-w-[580px]">
          <div className="relative flex items-center">
            <svg
              className="absolute left-4 text-[#94A3B8] pointer-events-none"
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
              className="w-full pl-12 pr-36 py-4 rounded-2xl bg-white text-[#0F172A] text-[16px] shadow-2xl outline-none border-2 border-transparent focus:border-[#2B7FFF] transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-[#2B7FFF] text-white text-[14px] font-semibold hover:bg-[#1D6AE5] transition-colors"
            >
              Search
            </button>
          </div>
        </form>
        {/* Stats */}
        <div className="flex items-center gap-8 mt-10 text-white/60 text-[13px]">
          <span>🎫 1M+ tickets sold</span>
          <span>🌍 200+ cities</span>
          <span>⭐ 4.8 avg rating</span>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-[1280px] mx-auto px-4 py-14">
        <h2 className="text-[26px] font-bold text-[#0F172A] mb-1">Popular Categories</h2>
        <p className="text-[#64748B] text-[15px] mb-7">Find exactly what you&apos;re looking for</p>
        <div className="flex flex-wrap gap-3">
          {popularCategories.map(cat => (
            <Link
              key={cat.slug}
              href={`/attractions/london?category=${cat.slug}`}
              className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-[#E5E7EB] hover:border-[#2B7FFF] hover:bg-[#EFF6FF] text-[14px] font-semibold text-[#374151] hover:text-[#2B7FFF] transition-all"
            >
              <span className="text-[18px]">{cat.icon}</span>
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="max-w-[1280px] mx-auto px-4 pb-14">
        <h2 className="text-[26px] font-bold text-[#0F172A] mb-1">Popular Destinations</h2>
        <p className="text-[#64748B] text-[15px] mb-7">Explore top cities around the world</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {destinations.map(dest => (
            <Link
              key={dest.slug}
              href={`/attractions/${dest.slug}`}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{ paddingBottom: '75%', position: 'relative', display: 'block' }}
            >
              <div className="absolute inset-0">
                <Image
                  src={`https://images.unsplash.com/${dest.photo}?w=500&h=375&fit=crop`}
                  alt={dest.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <span className="text-[17px] font-bold block drop-shadow">{dest.name}</span>
                  <span className="text-[12px] text-white/75">{dest.count}+ Experiences</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Experiences */}
      <section className="bg-[#F8FAFC] py-14">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="text-[26px] font-bold text-[#0F172A] mb-1">Featured Experiences</h2>
          <p className="text-[#64748B] text-[15px] mb-7">Handpicked top-rated attractions worldwide</p>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl animate-pulse overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-[#94A3B8] text-center py-12">No experiences available right now.</p>
          )}
        </div>
      </section>

      {/* Why Enttix */}
      <section className="max-w-[1280px] mx-auto px-4 py-16">
        <h2 className="text-[26px] font-bold text-[#0F172A] mb-1 text-center">Why Choose Enttix?</h2>
        <p className="text-[#64748B] text-[15px] mb-10 text-center">Everything you need for a perfect experience</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {whyEnttix.map(item => (
            <div key={item.title} className="text-center p-6 rounded-2xl bg-[#F8FAFC] hover:bg-white hover:shadow-md transition-all">
              <div className="text-[40px] mb-4">{item.icon}</div>
              <h3 className="text-[15px] font-bold text-[#0F172A] mb-2">{item.title}</h3>
              <p className="text-[13px] text-[#64748B] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
