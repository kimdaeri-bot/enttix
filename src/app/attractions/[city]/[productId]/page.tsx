'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

const CITY_MAP: Record<string, { name: string; photo: string }> = {
  london:    { name: 'London',    photo: 'photo-1513635269975-59663e0ac1ad' },
  paris:     { name: 'Paris',     photo: 'photo-1502602898657-3e91760cbb34' },
  barcelona: { name: 'Barcelona', photo: 'photo-1583422409516-2895a77efded' },
  rome:      { name: 'Rome',      photo: 'photo-1552832230-c0197dd311b5'    },
  amsterdam: { name: 'Amsterdam', photo: 'photo-1534351590666-13e3e96b5017' },
  dubai:     { name: 'Dubai',     photo: 'photo-1512453979798-5ea266f8880c' },
  singapore: { name: 'Singapore', photo: 'photo-1525625293386-3f8f99389edd' },
  prague:    { name: 'Prague',    photo: 'photo-1541849546-216549ae216d'    },
  madrid:    { name: 'Madrid',    photo: 'photo-1539037116277-4db20889f2d4' },
  vienna:    { name: 'Vienna',    photo: 'photo-1516550893923-42d28e5677af' },
  'new-york': { name: 'New York', photo: 'photo-1496442226666-8d4d0e62e6e9' },
  tokyo:     { name: 'Tokyo',     photo: 'photo-1540959733332-eab4deabeeaf' },
};

interface TiqetsProduct {
  id: number;
  title: string;
  tagline?: string;
  summary?: string;
  description?: string;
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
  country_name?: string;
  product_checkout_url?: string;
  product_url?: string;
  whats_included?: string[];
  whats_excluded?: string[];
  highlights?: string[];
}

type TabKey = 'overview' | 'includes' | 'highlights' | 'reviews';

function StarRating({ avg, size = 'md' }: { avg: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-[22px]' : size === 'sm' ? 'text-[12px]' : 'text-[16px]';
  const full = Math.round(avg);
  return (
    <span className={`text-amber-400 ${cls} leading-none`}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

function RatingBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-[#64748B] w-8 text-right flex-shrink-0">{label}★</span>
      <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[12px] text-[#94A3B8] w-8 flex-shrink-0">{value.toFixed(1)}</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const citySlug = params.city as string;
  const productId = params.productId as string;

  const cityInfo = CITY_MAP[citySlug];
  const fallbackImage = cityInfo
    ? `https://images.unsplash.com/${cityInfo.photo}?w=1200&h=600&fit=crop`
    : 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=600&fit=crop';

  const [product, setProduct] = useState<TiqetsProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tiqets/products/${productId}`)
      .then(r => r.json())
      .then(data => {
        if (data.product) {
          setProduct(data.product);
          // Resolve hero image
          const prod = data.product as TiqetsProduct;
          if (prod.images && prod.images.length > 0) {
            setHeroImage(prod.images[0]);
            setHeroLoading(false);
          } else if (prod.product_url) {
            fetch(`/api/tiqets/product-image?product_url=${encodeURIComponent(prod.product_url)}`)
              .then(r => r.json())
              .then(imgData => {
                setHeroImage(imgData.imageUrl || fallbackImage);
              })
              .catch(() => setHeroImage(fallbackImage))
              .finally(() => setHeroLoading(false));
          } else {
            setHeroImage(fallbackImage);
            setHeroLoading(false);
          }
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header hideSearch />
        <div className="h-[420px] bg-gray-200 animate-pulse" />
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4 max-w-xl">
            <div className="h-8 bg-gray-200 rounded-xl w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header hideSearch />
        <div className="flex items-center justify-center h-64 flex-col gap-4">
          <p className="text-[#64748B] text-[18px]">Product not found.</p>
          <Link href={`/attractions/${citySlug}`} className="text-[#2B7FFF] hover:underline">
            ← Back to {cityInfo?.name || 'City'}
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : heroImage ? [heroImage] : [fallbackImage];

  const displayImage = images[selectedImage] || heroImage || fallbackImage;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview',   label: 'Overview'    },
    { key: 'highlights', label: 'Highlights'  },
    { key: 'includes',   label: 'Includes'    },
    { key: 'reviews',    label: 'Reviews'     },
  ];

  const priceInt = Math.round(product.price || 0);

  // Simulated rating distribution (based on average)
  const avg = product.ratings?.average || 0;
  const ratingDist = avg > 0 ? [
    { label: '5', value: Math.min(avg, 5) },
    { label: '4', value: Math.max(0, avg - 0.5) },
    { label: '3', value: Math.max(0, avg - 1.5) },
    { label: '2', value: Math.max(0, avg - 2.5) },
    { label: '1', value: Math.max(0, avg - 3.5) },
  ] : [];

  return (
    <div className="min-h-screen bg-white">
      <Header hideSearch />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#F1F5F9]">
        <div className="max-w-[1280px] mx-auto px-4 py-2.5 text-[12px] text-[#94A3B8] flex items-center gap-1.5 flex-wrap">
          <Link href="/attractions" className="hover:text-[#2B7FFF] transition-colors">Attractions</Link>
          <span>/</span>
          <Link href={`/attractions/${citySlug}`} className="hover:text-[#2B7FFF] transition-colors">
            {cityInfo?.name || 'City'}
          </Link>
          <span>/</span>
          <span className="text-[#374151] line-clamp-1 max-w-[300px]">{product.title}</span>
        </div>
      </div>

      {/* Hero Image (full width) */}
      <div className="relative w-full h-[420px] bg-gray-100">
        {heroLoading ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
        ) : (
          <Image
            src={displayImage}
            alt={product.title}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Floating badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {product.promo_label === 'bestseller' && (
            <span className="bg-[#FF6B35] text-white text-[12px] font-bold px-3 py-1 rounded-full uppercase shadow">
              🏆 Bestseller
            </span>
          )}
          {product.skip_line && (
            <span className="bg-green-500 text-white text-[12px] font-bold px-3 py-1 rounded-full shadow">
              ⚡ Skip the Line
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            {images.slice(0, 5).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === i ? 'border-white scale-110' : 'border-white/40 hover:border-white/70'
                }`}
              >
                <Image src={img} alt="" width={56} height={40} className="object-cover w-full h-full" unoptimized />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left Column */}
          <div className="flex-1 min-w-0">
            {/* Title & meta */}
            <div className="mb-6">
              <h1 className="text-[30px] font-extrabold text-[#0F172A] leading-tight mb-3">
                {product.title}
              </h1>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {product.instant_ticket_delivery && (
                  <span className="bg-[#EFF6FF] text-[#2B7FFF] text-[12px] font-semibold px-3 py-1 rounded-full border border-[#BFDBFE]">
                    ✓ Instant Confirmation
                  </span>
                )}
                {product.cancellation && (
                  <span className="bg-[#ECFDF5] text-emerald-700 text-[12px] font-semibold px-3 py-1 rounded-full border border-emerald-200">
                    ↩ Free Cancellation
                  </span>
                )}
                {product.smartphone_ticket && (
                  <span className="bg-[#F5F3FF] text-purple-700 text-[12px] font-semibold px-3 py-1 rounded-full border border-purple-200">
                    📱 Mobile Ticket
                  </span>
                )}
                {product.duration && (
                  <span className="bg-[#F8FAFC] text-[#374151] text-[12px] font-semibold px-3 py-1 rounded-full border border-[#E5E7EB]">
                    ⏱ {product.duration}
                  </span>
                )}
              </div>

              {/* Rating summary */}
              {product.ratings && product.ratings.total > 0 && (
                <div className="flex items-center gap-3 pb-5 border-b border-[#F1F5F9]">
                  <StarRating avg={product.ratings.average} size="lg" />
                  <span className="text-[20px] font-extrabold text-[#0F172A]">
                    {product.ratings.average.toFixed(1)}
                  </span>
                  <span className="text-[14px] text-[#64748B]">
                    ({product.ratings.total.toLocaleString()} reviews)
                  </span>
                  {product.city_name && (
                    <>
                      <span className="text-[#E5E7EB]">•</span>
                      <span className="text-[14px] text-[#64748B] flex items-center gap-1">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                          <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                        {product.city_name}{product.country_name && `, ${product.country_name}`}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-[#E5E7EB] mb-6">
              <div className="flex gap-0">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3 text-[14px] font-semibold transition-colors border-b-2 -mb-px ${
                      activeTab === tab.key
                        ? 'border-[#2B7FFF] text-[#2B7FFF]'
                        : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {product.tagline && (
                    <p className="text-[17px] font-semibold text-[#0F172A]">{product.tagline}</p>
                  )}
                  {product.summary && (
                    <p className="text-[15px] text-[#374151] leading-relaxed">{product.summary}</p>
                  )}
                  {product.description && (
                    <div
                      className="text-[14px] text-[#374151] leading-relaxed prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  )}
                  {!product.tagline && !product.summary && !product.description && (
                    <p className="text-[#94A3B8]">No description available.</p>
                  )}
                </div>
              )}

              {activeTab === 'highlights' && (
                <div>
                  {product.highlights && product.highlights.length > 0 ? (
                    <ul className="space-y-3">
                      {product.highlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[14px] text-[#374151]">
                          <span className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2B7FFF] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#94A3B8]">No highlights available.</p>
                  )}
                </div>
              )}

              {activeTab === 'includes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[12px]">✓</span>
                      What&apos;s Included
                    </h3>
                    {product.whats_included && product.whats_included.length > 0 ? (
                      <ul className="space-y-2.5">
                        {product.whats_included.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#374151]">
                            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#94A3B8] text-[13px]">Not specified.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[12px]">✗</span>
                      What&apos;s Excluded
                    </h3>
                    {product.whats_excluded && product.whats_excluded.length > 0 ? (
                      <ul className="space-y-2.5">
                        {product.whats_excluded.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#374151]">
                            <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#94A3B8] text-[13px]">Not specified.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {product.ratings && product.ratings.total > 0 ? (
                    <div>
                      {/* Rating summary */}
                      <div className="flex flex-col sm:flex-row gap-8 mb-8">
                        {/* Big score */}
                        <div className="flex flex-col items-center justify-center bg-[#F8FAFC] rounded-2xl p-8 min-w-[160px]">
                          <div className="text-[56px] font-extrabold text-[#0F172A] leading-none mb-2">
                            {product.ratings.average.toFixed(1)}
                          </div>
                          <StarRating avg={product.ratings.average} size="lg" />
                          <p className="text-[13px] text-[#64748B] mt-2">
                            {product.ratings.total.toLocaleString()} reviews
                          </p>
                        </div>

                        {/* Rating bars */}
                        <div className="flex-1 space-y-3 justify-center flex flex-col">
                          {ratingDist.map(r => (
                            <RatingBar key={r.label} label={r.label} value={r.value} max={5} />
                          ))}
                        </div>
                      </div>

                      <a
                        href={product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E5E7EB] text-[14px] font-semibold text-[#374151] hover:bg-[#F8FAFC] transition-colors"
                      >
                        Read all reviews on Tiqets →
                      </a>
                    </div>
                  ) : (
                    <p className="text-[#94A3B8] py-8">No reviews yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Sticky Booking Card */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="sticky top-4">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden">
                {/* Price header */}
                <div className="bg-gradient-to-r from-[#0F172A] to-[#1a2f5a] p-6">
                  <p className="text-white/60 text-[13px] mb-1">Starting from</p>
                  <p className="text-[42px] font-extrabold text-white leading-none">
                    ${priceInt}
                  </p>
                  <p className="text-white/50 text-[12px] mt-1">per person · USD</p>
                </div>

                <div className="p-6">
                  {/* Info chips */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {product.duration && (
                      <span className="flex items-center gap-1 text-[12px] bg-[#F1F5F9] text-[#374151] px-3 py-1.5 rounded-full">
                        ⏱ {product.duration}
                      </span>
                    )}
                    {product.skip_line && (
                      <span className="flex items-center gap-1 text-[12px] bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                        ⚡ Skip Line
                      </span>
                    )}
                    {product.smartphone_ticket && (
                      <span className="flex items-center gap-1 text-[12px] bg-[#EFF6FF] text-[#2B7FFF] px-3 py-1.5 rounded-full border border-blue-200">
                        📱 Mobile Ticket
                      </span>
                    )}
                  </div>

                  {/* Book Now Button */}
                  {product.product_checkout_url && (
                    <a
                      href={product.product_checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-6 py-4 rounded-xl bg-[#FF6B35] hover:bg-[#E55A25] active:scale-[0.98] text-white text-[16px] font-bold transition-all mb-3 shadow-lg shadow-orange-200"
                    >
                      Book on Tiqets →
                    </a>
                  )}
                  {product.product_url && (
                    <a
                      href={product.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-6 py-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#374151] text-[14px] font-semibold transition-colors mb-5"
                    >
                      View Details on Tiqets
                    </a>
                  )}

                  {/* Trust badges */}
                  <div className="space-y-2.5 pt-4 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-2.5 text-[13px] text-[#374151]">
                      <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2B7FFF] flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
                      Instant confirmation
                    </div>
                    {product.cancellation && (
                      <div className="flex items-center gap-2.5 text-[13px] text-[#374151]">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">↩</span>
                        Free cancellation available
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-[13px] text-[#374151]">
                      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] flex-shrink-0">🔒</span>
                      Secure booking via Tiqets
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] text-[#374151]">
                      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] flex-shrink-0">📱</span>
                      Mobile & print tickets accepted
                    </div>
                  </div>
                </div>
              </div>

              {/* Back link */}
              <Link
                href={`/attractions/${citySlug}`}
                className="block mt-4 text-center text-[13px] text-[#94A3B8] hover:text-[#2B7FFF] transition-colors"
              >
                ← Back to {cityInfo?.name || 'City'} experiences
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
