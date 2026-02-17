import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrendingCard from '@/components/TrendingCard';
import NewlyAddedCard from '@/components/NewlyAddedCard';
import MatchRow from '@/components/MatchRow';
import Link from 'next/link';
import { getMatches, demoData } from '@/lib/api';
import SearchBar from '@/components/SearchBar';

const LEAGUE_TABS = [
  { id: 'epl', label: 'PREMIER LEAGUE', abbr: 'PL', color: '#3D195B' },
  { id: 'laliga', label: 'LA LIGA', abbr: 'LL', color: '#EE8707' },
  { id: 'bundesliga', label: 'BUNDESLIGA', abbr: 'BL', color: '#D20515' },
  { id: 'seriea', label: 'SERIE A', abbr: 'SA', color: '#024494' },
  { id: 'ligue1', label: 'LIGUE 1', abbr: 'L1', color: '#DFF201' },
  { id: 'ucl', label: 'CHAMPIONS LEAGUE', abbr: 'CL', color: '#00003C' },
  { id: 'f1', label: 'FORMULA 1', abbr: 'F1', color: '#E10600' },
  { id: 'nba', label: 'NBA', abbr: 'NBA', color: '#1D428A' },
];

const TREND_TAGS = ['Premier League', 'F1 Las Vegas', 'NBA Finals', 'El Clasico', 'Champions League'];

const STADIUM_IMAGES = [
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&h=600&fit=crop',
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=500&h=600&fit=crop',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=500&h=600&fit=crop',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&h=600&fit=crop',
];

const SPORTS_IMAGES = [
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=500&fit=crop',
];

const CITY_IMAGES: Record<string, string> = {
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
  milan: 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=600&h=400&fit=crop',
  manchester: 'https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=600&h=400&fit=crop',
  madrid: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop',
};

const REVIEWS = [
  { name: 'Sarah J.', badge: 'VERIFIED FAN', text: 'The interface is incredibly smooth. Secured my Champions League tickets in seconds!', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
  { name: 'Michael C.', badge: 'SEASON TICKET HOLDER', text: 'Finally a platform that looks and feels modern. The mobile experience is top notch.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
  { name: 'David L.', badge: 'FOOTBALL ENTHUSIAST', text: 'Love the clean aesthetic. It feels premium and trustworthy. Highly recommend.', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
  { name: 'Emma W.', badge: 'MUSIC LOVER', text: 'Enttix makes finding events in my city so easy. The rare filtering system is great.', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face' },
];

const TRENDING_LEAGUES = ['Premier League', 'Formula 1', 'NBA', 'La Liga', 'Champions League'];

export default async function Home() {
  const matches = await getMatches({ has_listing: 'true', per_page: '10' });
  const { cities } = demoData;

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero Section */}
      <div className="hero-bg min-h-[500px] md:min-h-[700px]">
        <Header transparent />
        <section className="relative w-full px-4 md:px-0">
          <div className="max-w-[1280px] mx-auto flex flex-col items-center pt-12 md:pt-24 pb-8 md:pb-16">
            {/* Hero Text */}
            <div className="flex flex-col md:flex-row items-center gap-0 md:gap-2">
              <h1 className="text-[48px] md:text-[72px] font-extrabold leading-[53px] md:leading-[79px] tracking-[-2.32px] md:tracking-[-3.48px] italic text-white">
                LIVE THE
              </h1>
              <h1 className="text-[48px] md:text-[72px] font-extrabold leading-[53px] md:leading-[79px] tracking-[-2.32px] md:tracking-[-3.48px] italic text-[#2B7FFF]">
                MOMENT
              </h1>
            </div>
            <p className="text-center mt-4 md:mt-6 text-[18px] md:text-[20px] font-medium leading-[28px] md:leading-[32px] tracking-[-0.45px] text-[rgba(219,234,254,0.8)]">
              Premium Sports Ticket Official Marketplace
            </p>
            <p className="text-center mt-2 text-[14px] md:text-[16px] text-[rgba(219,234,254,0.5)]">
              No hidden fees, 100% authentic guarantee
            </p>

            {/* AI Search Bar */}
            <div className="mt-8 md:mt-10 w-full flex justify-center">
              <SearchBar />
            </div>

            {/* Real-Time Trends */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <span className="text-[12px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[0.5px]">🔥 REAL-TIME TRENDS</span>
              {TREND_TAGS.map(t => (
                <span key={t} className="px-3 py-1.5 rounded-full bg-white/10 text-[12px] font-medium text-[#DBEAFE] hover:bg-white/20 cursor-pointer transition-colors">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Official Leagues Section */}
      <div className="bg-white">
        <section className="py-10 md:py-16 px-4 md:px-[55.5px]">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-8">
              <span className="text-[12px] font-bold text-[#EF4444] tracking-[1.5px]">OFFICIAL</span>{' '}
              <span className="text-[12px] font-bold text-[#171717] tracking-[1.5px]">LEAGUES</span>
            </div>

            {/* League Circle Icons */}
            <div className="flex items-center justify-center gap-8 md:gap-12 overflow-x-auto pb-4 scrollbar-hide">
              {LEAGUE_TABS.map(tab => (
                <Link
                  key={tab.id}
                  href={`/league/${demoData.leagues.find(l => l.id === tab.id)?.slug || tab.id}`}
                  className="flex flex-col items-center gap-3 flex-shrink-0 group"
                >
                  <div
                    className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-white text-[16px] font-bold tracking-[0.5px] shadow-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: tab.color }}
                  >
                    {tab.abbr}
                  </div>
                  <span className="text-[11px] font-semibold text-[#6B7280] text-center leading-[14px] max-w-[90px] tracking-[0.5px]">
                    {tab.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Trending Events */}
      <div className="bg-white">
        <section className="pb-12 md:pb-20 px-4 md:px-[55.5px]">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[22px] font-bold text-[#171717]">Trending Events 🔥</h2>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center text-white hover:bg-[#1E293B] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <button className="w-8 h-8 rounded-full bg-[#2B7FFF] flex items-center justify-center text-white hover:bg-[#1D6AE5] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
              {matches.slice(0, 5).map((m, i) => (
                <TrendingCard
                  key={m.id}
                  id={m.id}
                  homeTeam={m.homeTeam}
                  awayTeam={m.awayTeam}
                  datetime={m.datetime}
                  startingPrice={m.startingPrice}
                  currency={m.currency}
                  badge={i < 3 ? 'SELLING FAST' : i === 3 ? 'EXCLUSIVE EVENT' : undefined}
                  badgeColor={i < 3 ? 'red' : 'green'}
                  league={TRENDING_LEAGUES[i % TRENDING_LEAGUES.length]}
                  imageUrl={STADIUM_IMAGES[i % STADIUM_IMAGES.length]}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Match Schedule */}
      <section className="py-12 md:py-20 px-4 md:px-[55.5px] bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[22px] font-bold text-[#171717]">Match Schedule</h2>
              <div className="w-12 h-1 bg-[#2B7FFF] rounded-full mt-1" />
            </div>
            <Link href="/all-tickets" className="text-[13px] font-semibold text-[#2B7FFF] hover:text-[#1D6AE5]">
              View Full Schedule →
            </Link>
          </div>

          {/* Grid Header */}
          <div className="hidden md:grid grid-cols-[60px_1fr_200px_120px_40px] gap-4 px-6 pb-3 mt-6 text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] border-b border-[#E5E7EB]">
            <span>EVENT</span>
            <span></span>
            <span>LOCATION</span>
            <span className="text-right">TICKET PRICE</span>
            <span></span>
          </div>

          {/* Match Rows */}
          <div className="bg-white rounded-[16px] overflow-hidden">
            {matches.slice(0, 5).map(m => (
              <MatchRow
                key={m.id}
                id={m.id}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                datetime={m.datetime}
                venue={m.venue.name}
                city={m.venue.city}
                startingPrice={m.startingPrice}
                currency={m.currency}
                ticketsLeft={m.ticketsLeft}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Newly Added Tickets */}
      <section className="py-12 md:py-16 px-4 md:px-[55.5px]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[22px] font-bold text-[#171717]">Newly Added</h2>
              <div className="w-12 h-1 bg-[#2B7FFF] rounded-full mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] hover:bg-[#F1F5F9] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <button className="w-7 h-7 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] hover:bg-[#F1F5F9] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {matches.slice(0, 6).map((m, i) => (
              <NewlyAddedCard
                key={m.id}
                id={m.id}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                datetime={m.datetime}
                startingPrice={m.startingPrice}
                venue={m.venue.name}
                imageUrl={SPORTS_IMAGES[i % SPORTS_IMAGES.length]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="py-12 md:py-24 px-4 md:px-[55.5px]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[24px] font-bold text-[#171717]">Popular Cities</h2>
              <div className="w-12 h-1 bg-[#2B7FFF] rounded-full mt-1" />
            </div>
            <Link href="/cities" className="text-[13px] font-semibold text-[#2B7FFF] hover:text-[#1D6AE5]">
              VIEW ALL →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cities.map(city => (
              <Link
                key={city.slug}
                href={`/city/${city.slug}`}
                className="group relative rounded-[16px] overflow-hidden aspect-[16/10]"
              >
                <img
                  src={CITY_IMAGES[city.slug] || `https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop`}
                  alt={city.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <h3 className="text-[20px] font-bold text-white">{city.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-12 md:py-20 px-4 border-t border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[24px] font-bold text-[#171717] text-center mb-10">What Our Fans Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {REVIEWS.map(review => (
              <div key={review.name} className="bg-white rounded-[16px] p-6 border border-[#E5E7EB]">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={review.img}
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-[#171717]">{review.name}</p>
                    <p className="text-[10px] font-bold text-[#2B7FFF] tracking-[0.3px]">{review.badge}</p>
                  </div>
                  <div className="ml-auto">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#E5E7EB"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" stroke="none"/></svg>
                  </div>
                </div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <p className="text-[13px] text-[#6B7280] leading-[20px]">&ldquo;{review.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
