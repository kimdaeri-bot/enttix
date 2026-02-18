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
  const sizeClass = size === 'lg' ? 'text-[20px]' : size === 'sm' ? 'text-[12px]' : 'text-[16px]';
  return (
    <span className={`text-yellow-400 ${sizeClass}`}>
      {'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}
    </span>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const citySlug = params.city as string;
  const productId = params.productId as string;

  const cityInfo = CITY_MAP[citySlug];
  const fallbackImage = cityInfo
    ? `https://images.unsplash.com/${cityInfo.photo}?w=800&h=600&fit=crop`
    : 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop';

  const [product, setProduct] = useState<TiqetsProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/tiqets/products/${productId}`)
      .then(r => r.json())
      .then(data => {
        if (data.product) {
          setProduct(data.product);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Header hideSearch />
        <div className="max-w-[1280px] mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white rounded-xl w-1/3" />
            <div className="h-[400px] bg-white rounded-2xl" />
            <div className="h-6 bg-white rounded-xl w-2/3" />
            <div className="h-4 bg-white rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
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

  const images = product.images && product.images.length > 0 ? product.images : [fallbackImage];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'includes', label: 'Includes' },
    { key: 'highlights', label: 'Highlights' },
    { key: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 py-3 text-[13px] text-[#64748B] flex items-center gap-1 flex-wrap">
          <Link href="/attractions" className="hover:text-[#2B7FFF]">Attractions</Link>
          <span>/</span>
          <Link href={`/attractions/${citySlug}`} className="hover:text-[#2B7FFF]">{cityInfo?.name || 'City'}</Link>
          <span>/</span>
          <span className="text-[#0F172A] line-clamp-1">{product.title}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Column */}
          <div className="flex-1 min-w-0">
            {/* Image Gallery */}
            <div className="mb-6">
              <div className="relative rounded-2xl overflow-hidden h-[400px] mb-3">
                <Image
                  src={images[selectedImage]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
                {product.promo_label && (
                  <span className="absolute top-4 left-4 bg-orange-500 text-white text-[12px] font-bold px-3 py-1 rounded-full uppercase">
                    {product.promo_label}
                  </span>
                )}
                {product.skip_line && (
                  <span className="absolute top-4 right-4 bg-green-500 text-white text-[12px] font-bold px-3 py-1 rounded-full">
                    Skip the Line
                  </span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.slice(0, 6).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-[80px] h-[60px] rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === i ? 'border-[#2B7FFF]' : 'border-transparent'
                      }`}
                    >
                      <Image src={img} alt={`Image ${i + 1}`} width={80} height={60} className="object-cover w-full h-full" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <div className="mb-4">
              <h1 className="text-[28px] font-extrabold text-[#0F172A] leading-tight mb-3">
                {product.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {product.promo_label && (
                  <span className="bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">
                    🏆 {product.promo_label}
                  </span>
                )}
                {product.skip_line && (
                  <span className="bg-green-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    Skip Line
                  </span>
                )}
                {product.instant_ticket_delivery && (
                  <span className="bg-blue-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    ✓ Instant Confirmation
                  </span>
                )}
                {product.cancellation && (
                  <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                    ↩ Free Cancellation
                  </span>
                )}
              </div>

              {product.ratings && product.ratings.total > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <StarRating avg={product.ratings.average} size="lg" />
                  <span className="text-[16px] font-bold text-[#0F172A]">{product.ratings.average.toFixed(1)}</span>
                  <span className="text-[14px] text-[#64748B]">({product.ratings.total.toLocaleString()} reviews)</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                {product.city_name}{product.country_name && `, ${product.country_name}`}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#E5E7EB] mb-6">
              <div className="flex gap-0">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3 text-[14px] font-semibold transition-colors border-b-2 ${
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
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {activeTab === 'overview' && (
                <div>
                  {product.tagline && (
                    <p className="text-[16px] font-semibold text-[#0F172A] mb-4">{product.tagline}</p>
                  )}
                  {product.summary && (
                    <p className="text-[14px] text-[#374151] leading-relaxed mb-4">{product.summary}</p>
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

              {activeTab === 'includes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                      <span className="text-green-500">✓</span> What&apos;s Included
                    </h3>
                    {product.whats_included && product.whats_included.length > 0 ? (
                      <ul className="space-y-2">
                        {product.whats_included.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-[#374151]">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#94A3B8] text-[13px]">Not specified.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                      <span className="text-red-400">✗</span> What&apos;s Excluded
                    </h3>
                    {product.whats_excluded && product.whats_excluded.length > 0 ? (
                      <ul className="space-y-2">
                        {product.whats_excluded.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-[#374151]">
                            <span className="text-red-400 mt-0.5">✗</span>
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

              {activeTab === 'highlights' && (
                <div>
                  <h3 className="text-[15px] font-bold text-[#0F172A] mb-4">Highlights</h3>
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

              {activeTab === 'reviews' && (
                <div>
                  {product.ratings && product.ratings.total > 0 ? (
                    <div className="text-center py-8">
                      <div className="text-[64px] font-extrabold text-[#0F172A] mb-2">
                        {product.ratings.average.toFixed(1)}
                      </div>
                      <StarRating avg={product.ratings.average} size="lg" />
                      <p className="text-[14px] text-[#64748B] mt-2">
                        Based on {product.ratings.total.toLocaleString()} reviews
                      </p>
                      <a
                        href={product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#F1F5F9] text-[#374151] text-[14px] font-semibold hover:bg-[#E2E8F0] transition-colors"
                      >
                        Read All Reviews on Tiqets →
                      </a>
                    </div>
                  ) : (
                    <p className="text-[#94A3B8] text-center py-8">No reviews yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Sticky Booking Card */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="sticky top-4">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E5E7EB]">
                {/* Price */}
                <div className="mb-4">
                  <p className="text-[13px] text-[#64748B] mb-1">Starting from</p>
                  <p className="text-[36px] font-extrabold text-[#2B7FFF]">
                    ${product.price?.toFixed(2) || '—'}
                  </p>
                  <p className="text-[12px] text-[#94A3B8]">per person</p>
                </div>

                {/* Info Badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {product.duration && (
                    <span className="flex items-center gap-1 text-[12px] bg-[#F1F5F9] text-[#374151] px-3 py-1.5 rounded-full">
                      ⏱ {product.duration}
                    </span>
                  )}
                  {product.skip_line && (
                    <span className="flex items-center gap-1 text-[12px] bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                      ⚡ Skip Line
                    </span>
                  )}
                  {product.smartphone_ticket && (
                    <span className="flex items-center gap-1 text-[12px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                      📱 Mobile Ticket
                    </span>
                  )}
                </div>

                {/* Book Now */}
                {product.product_checkout_url && (
                  <a
                    href={product.product_checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-6 py-4 rounded-xl bg-[#FF6B35] hover:bg-[#E55A25] text-white text-[16px] font-bold transition-colors mb-3"
                  >
                    Book on Tiqets →
                  </a>
                )}
                {product.product_url && (
                  <a
                    href={product.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-6 py-3 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#374151] text-[14px] font-semibold transition-colors mb-5"
                  >
                    View on Tiqets
                  </a>
                )}

                {/* Trust Badges */}
                <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-[12px] text-[#374151]">
                    <span className="text-blue-500">✓</span> Instant confirmation
                  </div>
                  {product.cancellation && (
                    <div className="flex items-center gap-2 text-[12px] text-[#374151]">
                      <span className="text-emerald-500">↩</span> Free cancellation
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[12px] text-[#374151]">
                    <span className="text-[#374151]">🔒</span> Secure booking via Tiqets
                  </div>
                </div>
              </div>

              {/* Back Link */}
              <Link
                href={`/attractions/${citySlug}`}
                className="block mt-4 text-center text-[13px] text-[#64748B] hover:text-[#2B7FFF] transition-colors"
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
