'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

/* ─── COUNTRY MAP ───────────────────────────────────────────── */
const COUNTRY_MAP: Record<string, {
  id: string;
  name: string;
  photo: string;
  description: string;
  flag: string;
  guides: Array<{ title: string; category: string; gradient: string }>;
  cities: Array<{
    slug: string;
    name: string;
    cityId: number;
    photo: string;
  }>;
}> = {
  spain: {
    id: '50067',
    name: 'Spain',
    flag: '🇪🇸',
    photo: 'photo-1559827291-72416a4b7b9f',
    description: "Discover Spain's vibrant culture, stunning architecture, and world-class cuisine.",
    guides: [
      { title: 'Top 10 things to do in Barcelona', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: '2 days in Madrid itinerary', category: 'Itinerary', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Best museums in Spain', category: 'Art & Culture', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'barcelona', name: 'Barcelona', cityId: 66342, photo: 'photo-1583422409516-2895a77efded' },
      { slug: 'madrid',    name: 'Madrid',    cityId: 66254, photo: 'photo-1539037116277-4db20889f2d4' },
      { slug: 'seville',  name: 'Seville',   cityId: 63898, photo: 'photo-1559592413-7cec4d0cae2b' },
    ],
  },
  france: {
    id: '50074',
    name: 'France',
    flag: '🇫🇷',
    photo: 'photo-1499856871958-5b9627545d1a',
    description: 'From the Eiffel Tower to the French Riviera, France never disappoints.',
    guides: [
      { title: '48 hours in Paris — the perfect itinerary', category: 'Itinerary', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Best day trips from Paris', category: 'Day Trips', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: "France's top art museums", category: 'Art & Culture', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'paris', name: 'Paris', cityId: 66746, photo: 'photo-1502602898657-3e91760cbb34' },
      { slug: 'nice',  name: 'Nice',  cityId: 64396, photo: 'photo-1491166617655-b9a31e0e0541' },
    ],
  },
  italy: {
    id: '50109',
    name: 'Italy',
    flag: '🇮🇹',
    photo: 'photo-1516483638261-f4dbaf036963',
    description: "Explore the timeless beauty of Italy's art, history, and gastronomy.",
    guides: [
      { title: 'The ultimate Rome guide: Colosseum & beyond', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Venice in a day — what to see', category: 'Itinerary', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Florence Renaissance art masterclass', category: 'Art & Culture', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'rome',     name: 'Rome',     cityId: 71631, photo: 'photo-1552832230-c0197dd311b5' },
      { slug: 'venice',   name: 'Venice',   cityId: 67458, photo: 'photo-1534113414509-0eec2bfb493f' },
      { slug: 'florence', name: 'Florence', cityId: 64696, photo: 'photo-1541343672885-9be56236302a' },
    ],
  },
  'united-kingdom': {
    id: '50076',
    name: 'United Kingdom',
    flag: '🇬🇧',
    photo: 'photo-1513635269975-59663e0ac1ad',
    description: 'From Big Ben to the Scottish Highlands, the UK is full of iconic experiences.',
    guides: [
      { title: 'Top London attractions with skip-the-line tickets', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Edinburgh castle and the Royal Mile', category: 'City Guide', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Best UK countryside day trips', category: 'Day Trips', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'london',    name: 'London',    cityId: 67458, photo: 'photo-1513635269975-59663e0ac1ad' },
      { slug: 'edinburgh', name: 'Edinburgh', cityId: 62841, photo: 'photo-1506377872008-6645d9d29ef7' },
    ],
  },
  netherlands: {
    id: '50166',
    name: 'Netherlands',
    flag: '🇳🇱',
    photo: 'photo-1534351590666-13e3e96b5017',
    description: "Explore Amsterdam's canals, world-class museums, and tulip fields.",
    guides: [
      { title: 'Amsterdam canal tour guide', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Rijksmuseum & Van Gogh Museum: the ultimate guide', category: 'Art & Culture', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Best day trips from Amsterdam', category: 'Day Trips', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'amsterdam', name: 'Amsterdam', cityId: 75061, photo: 'photo-1534351590666-13e3e96b5017' },
    ],
  },
  germany: {
    id: '50056',
    name: 'Germany',
    flag: '🇩🇪',
    photo: 'photo-1467269204594-9661b134dd2b',
    description: "From Berlin's history to Bavaria's castles, Germany has it all.",
    guides: [
      { title: 'Berlin: history, art, and nightlife', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Neuschwanstein castle day trip from Munich', category: 'Day Trips', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Best Christmas markets in Germany', category: 'Seasonal', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'berlin', name: 'Berlin', cityId: 60533, photo: 'photo-1560969184-10fe8719e047' },
      { slug: 'munich', name: 'Munich', cityId: 63862, photo: 'photo-1595867818082-083862f3d630' },
    ],
  },
  austria: {
    id: '50011',
    name: 'Austria',
    flag: '🇦🇹',
    photo: 'photo-1516550893923-42d28e5677af',
    description: 'Mozart, Klimt, and the Vienna Philharmonic — Austria is a cultural paradise.',
    guides: [
      { title: 'Vienna in 2 days: palaces and coffee houses', category: 'Itinerary', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Schönbrunn Palace: full visitor guide', category: 'City Guide', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Top classical music concerts in Vienna', category: 'Performing Arts', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'vienna', name: 'Vienna', cityId: 60335, photo: 'photo-1516550893923-42d28e5677af' },
    ],
  },
  'czech-republic': {
    id: '50055',
    name: 'Czech Republic',
    flag: '🇨🇿',
    photo: 'photo-1541849546-216549ae216d',
    description: "Prague's fairy-tale architecture and rich history await.",
    guides: [
      { title: 'Prague Castle and Old Town walking tour', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Best beer halls in Prague', category: 'Food & Drink', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Day trips from Prague', category: 'Day Trips', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'prague', name: 'Prague', cityId: 64162, photo: 'photo-1541849546-216549ae216d' },
    ],
  },
  'united-states': {
    id: '50233',
    name: 'United States',
    flag: '🇺🇸',
    photo: 'photo-1496442226666-8d4d0e62e6e9',
    description: "From New York's skyline to Hollywood's glamour, the US has something for everyone.",
    guides: [
      { title: 'New York City in 3 days: the ultimate guide', category: 'Itinerary', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Statue of Liberty: tickets & tips', category: 'City Guide', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Best Broadway shows to see this season', category: 'Performing Arts', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'new-york', name: 'New York', cityId: 260932, photo: 'photo-1496442226666-8d4d0e62e6e9' },
    ],
  },
  japan: {
    id: '50113',
    name: 'Japan',
    flag: '🇯🇵',
    photo: 'photo-1540959733332-eab4deabeeaf',
    description: 'Ancient temples, futuristic cities, and breathtaking nature — Japan is unforgettable.',
    guides: [
      { title: 'Tokyo: anime, temples, and street food', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Kyoto temple hopping itinerary', category: 'Itinerary', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Japan rail pass: everything you need to know', category: 'Travel Tips', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'tokyo', name: 'Tokyo', cityId: 72181, photo: 'photo-1540959733332-eab4deabeeaf' },
      { slug: 'kyoto', name: 'Kyoto', cityId: 68094, photo: 'photo-1493976040374-85c8e12f0c0e' },
    ],
  },
  singapore: {
    id: '50199',
    name: 'Singapore',
    flag: '🇸🇬',
    photo: 'photo-1525625293386-3f8f99389edd',
    description: 'A futuristic city-state where cultures, cuisines, and nature converge.',
    guides: [
      { title: 'Gardens by the Bay: tickets & light show', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Singapore hawker food guide', category: 'Food & Drink', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Sentosa Island: best things to do', category: 'Outdoor', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'singapore', name: 'Singapore', cityId: 78125, photo: 'photo-1525625293386-3f8f99389edd' },
    ],
  },
  'united-arab-emirates': {
    id: '50001',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    photo: 'photo-1512453979798-5ea266f8880c',
    description: 'Dubai and Abu Dhabi blend tradition with ultra-modern luxury.',
    guides: [
      { title: 'Burj Khalifa: top tips for visiting', category: 'City Guide', gradient: 'from-[#2B7FFF] to-[#1D6AE5]' },
      { title: 'Dubai desert safari: what to expect', category: 'Outdoor', gradient: 'from-[#FF6B35] to-[#e55a27]' },
      { title: 'Abu Dhabi day trip from Dubai', category: 'Day Trips', gradient: 'from-[#0F172A] to-[#1E293B]' },
    ],
    cities: [
      { slug: 'dubai', name: 'Dubai', cityId: 60005, photo: 'photo-1512453979798-5ea266f8880c' },
    ],
  },
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

/* ─── PRODUCT CARD ───────────────────────────────────────────── */
function ProductCard({
  product,
  countrySlug,
  fallbackPhoto,
}: {
  product: TiqetsProduct;
  countrySlug: string;
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

  // Determine city slug from city_name
  const citySlug = product.city_name
    ? product.city_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : countrySlug;

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
        {product.city_name && (
          <p className="text-[11px] text-[#94A3B8] mb-1">📍 {product.city_name}</p>
        )}
        {price > 0 && (
          <p className="text-[15px] font-bold text-[#0F172A] mt-auto">From ${price}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── CITY CARD ──────────────────────────────────────────────── */
function CityCard({ city }: { city: { slug: string; name: string; photo: string } }) {
  return (
    <Link
      href={`/attractions/${city.slug}`}
      className="group relative rounded-xl overflow-hidden cursor-pointer block"
      style={{ paddingBottom: '75%', position: 'relative' }}
    >
      <div className="absolute inset-0">
        <Image
          src={`https://images.unsplash.com/${city.photo}?w=500&h=375&fit=crop`}
          alt={city.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <span className="text-[17px] font-bold block drop-shadow">{city.name}</span>
          <span className="text-[12px] text-white/75">Explore experiences →</span>
        </div>
      </div>
    </Link>
  );
}

/* ─── PAGE ───────────────────────────────────────────────────── */
export default function CountryAttractionsPage() {
  const params = useParams();
  const countrySlug = params.countrySlug as string;
  const countryInfo = COUNTRY_MAP[countrySlug];

  const [products, setProducts] = useState<TiqetsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(24);
  const [sort, setSort] = useState<SortKey>('popular');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(null);

  const fetchProducts = useCallback(async () => {
    if (!countryInfo) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tiqets/products?country_id=${countryInfo.id}&page=1&page_size=48`
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [countryInfo]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ─── Filter & sort ───────────────────── */
  let filtered = [...products];
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

  const displayed = sorted.slice(0, displayCount);
  const hasMore = displayed.length < sorted.length;

  /* ─── Not found ───────────────────────── */
  if (!countryInfo) {
    return (
      <div className="min-h-screen bg-white">
        <Header hideSearch />
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-[#64748B] text-[18px]">Country not found.</p>
          <Link href="/attractions" className="text-[#2B7FFF] hover:underline text-[14px]">
            ← Back to Attractions
          </Link>
        </div>
      </div>
    );
  }

  const heroUrl = `https://images.unsplash.com/${countryInfo.photo}?w=1600&h=600&fit=crop`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header hideSearch />

      {/* ─── 1. HERO ──────────────────────────────────────── */}
      <section className="relative h-[400px] flex flex-col justify-end pb-10">
        <Image src={heroUrl} alt={countryInfo.name} fill className="object-cover" unoptimized priority />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-3">
            <Link href="/attractions" className="hover:text-white transition-colors">Attractions</Link>
            <span>›</span>
            <span className="text-white/90">{countryInfo.name}</span>
          </div>
          {/* H1 */}
          <h1 className="text-[42px] sm:text-[52px] font-extrabold text-white mb-2 leading-tight">
            Things to do in {countryInfo.name}
          </h1>
          <p className="text-white/75 text-[15px]">
            {products.length > 0 ? `${products.length}+` : '100+'} Experiences Available
          </p>
        </div>
      </section>

      {/* ─── 2. BEST PLACES TO VISIT ──────────────────────── */}
      <section className="bg-white py-10 border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
            Best places to visit in {countryInfo.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {countryInfo.cities.map(city => (
              <CityCard key={city.slug} city={city} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. FILTER BAR (sticky) ────────────────────────── */}
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
                All experiences in {countryInfo.name}
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

      {/* ─── 4. MAIN GRID ──────────────────────────────────── */}
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
                  countrySlug={countrySlug}
                  fallbackPhoto={countryInfo.photo}
                />
              ))}
            </div>

            {/* Load More */}
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
              onClick={() => { setActiveCategory(null); }}
              className="text-[#2B7FFF] text-[14px] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ─── 5. GUIDES & ITINERARIES ─────────────────────── */}
        <section className="mt-16">
          <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
            {countryInfo.name} guides and itineraries
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {countryInfo.guides.map((guide, i) => (
              <a
                key={i}
                href="#"
                className={`group rounded-xl overflow-hidden bg-gradient-to-br ${guide.gradient} p-6 flex flex-col min-h-[160px] hover:opacity-90 transition-opacity`}
              >
                <span className="text-white/70 text-[11px] font-bold uppercase tracking-widest mb-2">
                  {guide.category}
                </span>
                <h3 className="text-white font-bold text-[16px] leading-snug flex-1">
                  {guide.title}
                </h3>
                <span className="text-white/80 text-[13px] mt-4 group-hover:underline">
                  Read more →
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* ─── 6. BROWSE OTHER COUNTRIES ───────────────────── */}
        <section className="mt-16 mb-4">
          <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-2">
            Explore more countries
          </h2>
          <p className="text-[#64748B] text-[14px] mb-5">
            Discover experiences in other top destinations
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(COUNTRY_MAP)
              .filter(([slug]) => slug !== countrySlug)
              .slice(0, 8)
              .map(([slug, info]) => (
                <Link
                  key={slug}
                  href={`/attractions/country/${slug}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#374151] text-[13px] font-semibold hover:border-[#2B7FFF] hover:text-[#2B7FFF] transition-colors"
                >
                  <span>{info.flag}</span>
                  {info.name}
                </Link>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
