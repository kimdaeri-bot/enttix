// ISR: 5분마다 재생성 (매 요청 SSR → Vercel 엣지 캐시)
export const revalidate = 300;

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrendingCard from '@/components/TrendingCard';
import NewlyAddedCard from '@/components/NewlyAddedCard';
import MatchRow from '@/components/MatchRow';
import Link from 'next/link';
import { getMatches, demoData } from '@/lib/api';
import { getTranslations } from 'next-intl/server';
import SearchBar from '@/components/SearchBar';

const LEAGUE_TO_POPULAR: Record<string, string> = {
  epl: 'premier-league',
  laliga: 'la-liga',
  bundesliga: 'bundesliga',
  seriea: 'serie-a',
  ligue1: 'ligue1',
  ucl: 'ucl',
  f1: 'formula1',
  nba: 'nba',
};

const LEAGUE_TABS = [
  { id: 'epl', label: 'PREMIER\nLEAGUE', img: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=200&h=200&fit=crop' },
  { id: 'laliga', label: 'LA LIGA', img: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=200&h=200&fit=crop' },
  { id: 'bundesliga', label: 'BUNDESLIGA', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop' },
  { id: 'seriea', label: 'SERIE A', img: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=200&h=200&fit=crop' },
  { id: 'ligue1', label: 'LIGUE 1', img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=200&h=200&fit=crop' },
  { id: 'ucl', label: 'CHAMPIONS\nLEAGUE', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&h=200&fit=crop' },
  { id: 'f1', label: 'FORMULA 1', img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&h=200&fit=crop' },
  { id: 'nba', label: 'NBA', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop' },
];

const TREND_TAGS = ['Premier League', 'F1 Las Vegas', 'NBA Finals', 'El Clasico', 'Champions League'];

const STADIUM_IMAGES = [
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&h=600&fit=crop',
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=500&h=600&fit=crop',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=500&h=600&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&h=600&fit=crop',
];

const SPORTS_IMAGES = [
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=500&fit=crop',
];

const POPULAR_COUNTRIES = [
  { slug: 'italy',         name: 'Italy',          img: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&h=400&fit=crop' },
  { slug: 'united-kingdom',name: 'United Kingdom', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop' },
  { slug: 'france',        name: 'France',         img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop' },
  { slug: 'spain',         name: 'Spain',          img: 'https://images.unsplash.com/photo-1559827291-72416a4b7b9f?w=600&h=400&fit=crop' },
  { slug: 'portugal',      name: 'Portugal',       img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=400&fit=crop' },
  { slug: 'united-states', name: 'United States',  img: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=600&h=400&fit=crop' },
];


const REVIEWS = [
  { name: 'Sarah J.', badge: 'VERIFIED FAN', text: 'The interface is incredibly smooth. Secured my Champions League tickets in seconds!', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
  { name: 'Michael C.', badge: 'SEASON TICKET HOLDER', text: 'Finally a platform that looks and feels modern. The mobile experience is top notch.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
  { name: 'David L.', badge: 'FOOTBALL ENTHUSIAST', text: 'Love the clean aesthetic. It feels premium and trustworthy. Highly recommend.', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
  { name: 'Emma W.', badge: 'MUSIC LOVER', text: 'Enttix makes finding events in my city so easy. The rare filtering system is great.', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face' },
];

const TRENDING_LEAGUES = ['Premier League', 'Formula 1', 'NBA', 'La Liga', 'Champions League'];

// Man City vs Newcastle — Diplat Co 리스팅 (Tixstock 내부 API에서 확인된 실제 데이터)
const MAN_CITY_MATCH = {
  id: '01kdmq9xzg3fpwa884q65vpcrs',
  name: 'Manchester City FC vs Newcastle United FC',
  homeTeam: 'Manchester City FC',
  awayTeam: 'Newcastle United FC',
  datetime: '2026-02-21T15:00:00+0000',
  venue: { id: 'etihad', name: 'Etihad Stadium', address_line_1: '', address_line_2: '', city: 'Manchester', state: 'England', postcode: '', country_code: 'GB', latitude: 53.4831, longitude: -2.2004 },
  leagueId: 'epl',
  leagueName: 'English Premier League',
  startingPrice: 111,
  currency: 'GBP',
  ticketsLeft: 4,
};

// 추가 EPL 경기 데이터 (실제 시즌 일정 기반)
const EXTRA_EPL_MATCHES = [
  {
    id: 'epl-crystal-palace-newcastle-apr12',
    name: 'Crystal Palace FC vs Newcastle United FC',
    homeTeam: 'Crystal Palace FC',
    awayTeam: 'Newcastle United FC',
    datetime: '2026-04-12T14:00:00+0100',
    venue: { id: 'selhurst', name: 'Selhurst Park Stadium', address_line_1: '', address_line_2: '', city: 'London', state: 'England', postcode: '', country_code: 'GB', latitude: 51.3983, longitude: -0.0855 },
    leagueId: 'epl',
    leagueName: 'English Premier League',
    startingPrice: 83.91,
    currency: 'EUR',
    ticketsLeft: 0,
  },
  {
    id: 'epl-sunderland-tottenham-apr12',
    name: 'Sunderland AFC vs Tottenham Hotspur FC',
    homeTeam: 'Sunderland AFC',
    awayTeam: 'Tottenham Hotspur FC',
    datetime: '2026-04-12T14:00:00+0100',
    venue: { id: 'stadium-of-light', name: 'Stadium of Light', address_line_1: '', address_line_2: '', city: 'Sunderland', state: 'England', postcode: '', country_code: 'GB', latitude: 54.9144, longitude: -1.3882 },
    leagueId: 'epl',
    leagueName: 'English Premier League',
    startingPrice: 79.04,
    currency: 'EUR',
    ticketsLeft: 0,
  },
  {
    id: 'epl-nottingham-astonvilla-apr12',
    name: 'Nottingham Forest FC vs Aston Villa FC',
    homeTeam: 'Nottingham Forest FC',
    awayTeam: 'Aston Villa FC',
    datetime: '2026-04-12T14:00:00+0100',
    venue: { id: 'city-ground', name: 'City Ground', address_line_1: '', address_line_2: '', city: 'Nottingham', state: 'England', postcode: '', country_code: 'GB', latitude: 52.9400, longitude: -1.1327 },
    leagueId: 'epl',
    leagueName: 'English Premier League',
    startingPrice: 0,
    currency: 'EUR',
    ticketsLeft: 0,
  },
  {
    id: 'epl-chelsea-mancity-apr12',
    name: 'Chelsea FC vs Manchester City FC',
    homeTeam: 'Chelsea FC',
    awayTeam: 'Manchester City FC',
    datetime: '2026-04-12T16:30:00+0100',
    venue: { id: 'stamford-bridge', name: 'Stamford Bridge', address_line_1: '', address_line_2: '', city: 'London', state: 'England', postcode: '', country_code: 'GB', latitude: 51.4817, longitude: -0.1910 },
    leagueId: 'epl',
    leagueName: 'English Premier League',
    startingPrice: 211.60,
    currency: 'EUR',
    ticketsLeft: 0,
  },
  {
    id: 'epl-arsenal-liverpool-apr18',
    name: 'Arsenal FC vs Liverpool FC',
    homeTeam: 'Arsenal FC',
    awayTeam: 'Liverpool FC',
    datetime: '2026-04-18T17:30:00+0100',
    venue: { id: 'emirates', name: 'Emirates Stadium', address_line_1: '', address_line_2: '', city: 'London', state: 'England', postcode: '', country_code: 'GB', latitude: 51.5549, longitude: -0.1084 },
    leagueId: 'epl',
    leagueName: 'English Premier League',
    startingPrice: 189.50,
    currency: 'EUR',
    ticketsLeft: 0,
  },
  {
    id: 'epl-manutd-chelsea-apr25',
    name: 'Manchester United FC vs Chelsea FC',
    homeTeam: 'Manchester United FC',
    awayTeam: 'Chelsea FC',
    datetime: '2026-04-25T15:00:00+0100',
    venue: { id: 'old-trafford', name: 'Old Trafford', address_line_1: '', address_line_2: '', city: 'Manchester', state: 'England', postcode: '', country_code: 'GB', latitude: 53.4631, longitude: -2.2913 },
    leagueId: 'epl',
    leagueName: 'English Premier League',
    startingPrice: 145.00,
    currency: 'EUR',
    ticketsLeft: 6,
  },
];

export default async function Home() {
  const t = await getTranslations('home');
  const apiMatches = await getMatches({ listing_available: "true", per_page: '50' });
  // Man City 맨 앞에 추가, 중복 제거
  const matches = [MAN_CITY_MATCH, ...apiMatches.filter(m => m.id !== MAN_CITY_MATCH.id)];

  // Match Schedule: EPL only, sorted by date ascending + 추가 경기 병합
  const extraIds = new Set(EXTRA_EPL_MATCHES.map(m => m.id));
  const eplSchedule = [
    ...matches.filter(m => (m.leagueId === 'epl' || m.leagueName === 'English Premier League') && !extraIds.has(m.id)),
    ...EXTRA_EPL_MATCHES,
  ].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  // Newly Added: all matches, max 20
  const newlyAddedMatches = matches.slice(0, 20);
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero Section */}
      <div className="hero-bg min-h-[500px] md:min-h-[580px]">
        <Header transparent hideSearch />
        <section className="relative w-full px-4 md:px-0">
          <div className="max-w-[1280px] mx-auto flex flex-col items-center pt-12 md:pt-24 pb-4 md:pb-8">
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
              <SearchBar inline />
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
            <div className="flex items-center justify-start md:justify-center gap-6 md:gap-10 overflow-x-auto pb-4 px-4 scrollbar-hide">
              {LEAGUE_TABS.map(tab => (
                <Link
                  key={tab.id}
                  href={`/popular?category=${LEAGUE_TO_POPULAR[tab.id] || tab.id}`}
                  className="flex flex-col items-center flex-shrink-0 group"
                >
                  <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden relative shadow-lg group-hover:scale-110 transition-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tab.img} alt={tab.label.replace('\n', ' ')} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/45" />
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] md:text-[13px] font-bold tracking-[1px] text-center leading-[16px] whitespace-pre-line px-2">
                      {tab.label}
                    </span>
                  </div>
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
              <h2 className="text-[22px] font-bold text-[#171717]">{t('trending')}</h2>
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
              <h2 className="text-[22px] font-bold text-[#171717]">{t('match_schedule')}</h2>
              <div className="w-12 h-1 bg-[#2B7FFF] rounded-full mt-1" />
            </div>
            <Link href="/all-tickets" className="text-[13px] font-semibold text-[#2B7FFF] hover:text-[#1D6AE5]">
              View Full Schedule →
            </Link>
          </div>

          {/* Match Rows */}
          <div className="mt-6">
            {eplSchedule.slice(0, 15).map(m => (
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
              <h2 className="text-[22px] font-bold text-[#171717]">{t('newly_added')}</h2>
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
            {newlyAddedMatches.map((m, i) => (
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

      {/* Popular Countries */}
      <section className="py-12 md:py-24 px-4 md:px-[55.5px]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[24px] font-bold text-[#171717]">Popular Destinations</h2>
              <div className="w-12 h-1 bg-[#2B7FFF] rounded-full mt-1" />
            </div>
            <Link href="/attractions" className="text-[13px] font-semibold text-[#2B7FFF] hover:text-[#1D6AE5]">
              VIEW ALL →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {POPULAR_COUNTRIES.map(country => (
              <Link
                key={country.slug}
                href={`/attractions/country/${country.slug}`}
                className="group relative rounded-[16px] overflow-hidden aspect-[16/10]"
              >
                <img
                  src={country.img}
                  alt={country.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <h3 className="text-[20px] font-bold text-white">{country.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-12 md:py-20 px-4 border-t border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[24px] font-bold text-[#171717] text-center mb-10">{t('fans_say')}</h2>
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
