import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MatchCard from '@/components/MatchCard';
import MatchRow from '@/components/MatchRow';
import Link from 'next/link';
import { demoData } from '@/lib/api';

export default function Home() {
  const { matches, leagues, cities } = demoData;

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero Section */}
      <div className="hero-bg min-h-[600px] md:min-h-[850px]">
        <Header transparent />
        <section className="relative w-full px-4 md:px-0">
          <div className="max-w-[1280px] mx-auto flex flex-col items-center pt-16 md:pt-32 pb-8 md:pb-16">
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

            {/* Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch gap-3 mt-6 md:mt-10 w-full max-w-[700px]">
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-[12px] px-4 py-3 border border-white/10">
                <label className="text-[11px] font-semibold text-[rgba(219,234,254,0.6)] tracking-[0.5px] block mb-1">LOCATION</label>
                <select className="w-full bg-transparent text-white text-[14px] outline-none appearance-none cursor-pointer">
                  <option value="" className="text-black">All Locations</option>
                  <option value="london" className="text-black">London</option>
                  <option value="manchester" className="text-black">Manchester</option>
                  <option value="barcelona" className="text-black">Barcelona</option>
                  <option value="madrid" className="text-black">Madrid</option>
                </select>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-[12px] px-4 py-3 border border-white/10">
                <label className="text-[11px] font-semibold text-[rgba(219,234,254,0.6)] tracking-[0.5px] block mb-1">DATE</label>
                <input
                  type="date"
                  className="w-full bg-transparent text-white text-[14px] outline-none cursor-pointer [color-scheme:dark]"
                  placeholder="Select Date"
                />
              </div>
              <button className="bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[14px] px-8 py-3 rounded-[12px] transition-colors active:scale-95">
                SEARCH
              </button>
            </div>

            {/* Live Trends */}
            <div className="flex items-center gap-3 mt-8">
              <span className="text-[12px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[0.5px]">LIVE TRENDS</span>
              {['Premier League', 'Spanish La Liga', 'Champions League'].map(t => (
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
        <section className="py-12 md:py-20 px-4 md:px-[55.5px] bg-white">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-[#2B7FFF] tracking-[1px]">OFFICIAL</span>
              <span className="text-[11px] font-semibold text-[#9CA3AF] tracking-[1px]">LEAGUES</span>
            </div>
            <div className="flex items-center gap-6 mb-8">
              {leagues.map(league => (
                <Link
                  key={league.id}
                  href={`/league/${league.slug}`}
                  className="text-[15px] font-bold text-[#171717] hover:text-[#2B7FFF] transition-colors pb-2 border-b-2 border-transparent hover:border-[#2B7FFF]"
                >
                  {league.name.toUpperCase()}
                </Link>
              ))}
            </div>

            {/* Match Schedule Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-[#171717]">Match Schedule</h2>
              <Link href="/all-tickets" className="text-[13px] font-semibold text-[#2B7FFF] hover:text-[#1D6AE5]">
                View All Schedule
              </Link>
            </div>

            {/* Match Schedule Grid Header */}
            <div className="hidden md:grid grid-cols-[60px_1fr_200px_120px] gap-4 px-6 pb-3 text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px]">
              <span></span>
              <span>MATCH</span>
              <span>VENUE</span>
              <span className="text-right">TICKET PRICE</span>
            </div>

            {/* Match Rows */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] overflow-hidden">
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
      </div>

      {/* Newly Added Tickets */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[20px] font-bold text-[#171717] mb-6">
            Newly Added<br />
            <span className="text-[#2B7FFF]">TICKET</span>
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {matches.map(m => (
              <MatchCard
                key={m.id}
                id={m.id}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                datetime={m.datetime}
                startingPrice={m.startingPrice}
                currency={m.currency}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="py-12 md:py-24 px-4">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[24px] font-bold text-[#171717]">Popular Cities</h2>
            <Link href="/cities" className="text-[13px] font-semibold text-[#2B7FFF] hover:text-[#1D6AE5]">
              VIEW ALL
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cities.map(city => (
              <Link
                key={city.slug}
                href={`/city/${city.slug}`}
                className="group relative rounded-[16px] overflow-hidden aspect-[16/10] bg-gradient-to-br from-[#1E3A5F] to-[#0F172A]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                  <h3 className="text-[18px] font-bold text-white mb-1">{city.name}</h3>
                  <span className="text-[12px] font-semibold text-[#DBEAFE] tracking-[0.5px] group-hover:text-[#2B7FFF] transition-colors">
                    EXPLORE EVENTS
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-12 md:py-24 px-4 border-t border-[#F5F5F5]">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[24px] font-bold text-[#171717] text-center mb-10">Customer Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: 'Sarah J.', badge: 'VERIFIED FAN', text: 'The interface is incredibly smooth. Secured my Champions League tickets in minutes!' },
              { name: 'Michael C.', badge: 'SEASON TICKET HOLDER', text: 'Finally a platform that looks and feels modern. The ticket selection process is seamless.' },
              { name: 'Emma T.', badge: 'FOOTBALL ENTHUSIAST', text: 'Best ticket platform I\'ve used. Fast checkout and reliable delivery every time.' },
              { name: 'David R.', badge: 'SPORTS FAN', text: 'Great selection of events and competitive prices. Highly recommend to any sports fan!' },
            ].map(review => (
              <div key={review.name} className="bg-white rounded-[16px] p-6 border border-[#E5E7EB]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[14px] font-bold text-[#475569]">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#171717]">{review.name}</p>
                    <p className="text-[11px] font-semibold text-[#2B7FFF] tracking-[0.3px]">{review.badge}</p>
                  </div>
                </div>
                <p className="text-[14px] text-[#6B7280] leading-[22px] italic">&ldquo;{review.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
