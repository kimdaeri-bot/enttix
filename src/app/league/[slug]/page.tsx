import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MatchCard from '@/components/MatchCard';
import MatchRow from '@/components/MatchRow';
import { demoData } from '@/lib/api';

export default async function LeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const league = demoData.leagues.find(l => l.slug === slug);
  const matches = demoData.matches.filter(m =>
    league?.name && m.leagueName === league.name
  );

  if (!league) {
    return <div className="min-h-screen flex items-center justify-center text-[24px] font-bold">League not found</div>;
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="hero-bg pb-16">
        <Header transparent />
        <div className="max-w-[1280px] mx-auto px-4 pt-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-[rgba(219,234,254,0.5)] tracking-[1px]">OFFICIAL TICKET PARTNER</span>
          </div>
          <h1 className="text-[36px] md:text-[48px] font-extrabold text-white leading-tight">
            {league.name}
          </h1>
          <p className="text-[14px] text-[rgba(219,234,254,0.5)] mt-2">2024/25 Season</p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 -mt-8">
        {/* Popular Events Cards */}
        <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mb-4">Popular events</h3>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
          {matches.slice(0, 6).map(m => (
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

        {/* Match Schedule */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#171717]">{league.name}</h2>
            <span className="text-[14px] font-semibold text-[#9CA3AF]">{matches.length}</span>
          </div>

          {/* Grid Header */}
          <div className="hidden md:grid grid-cols-[60px_1fr_200px_120px] gap-4 px-6 pb-3 text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px]">
            <span></span>
            <span>MATCH DATE & DETAILS</span>
            <span>LOCATION</span>
            <span className="text-right">STARTING PRICE</span>
          </div>

          <div className="bg-white rounded-[16px] border border-[#E5E7EB] overflow-hidden">
            {matches.map(m => (
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

        {/* Filters */}
        <div className="mt-8 bg-white rounded-[16px] border border-[#E5E7EB] p-6">
          <h3 className="text-[14px] font-semibold text-[#171717] mb-4">Filter</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block mb-1.5">TEAM</label>
              <select className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[13px] outline-none focus:border-[#2B7FFF]">
                <option>All Teams</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block mb-1.5">VENUE</label>
              <select className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[13px] outline-none focus:border-[#2B7FFF]">
                <option>All Venues</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block mb-1.5">CITY</label>
              <select className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[13px] outline-none focus:border-[#2B7FFF]">
                <option>All Cities</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block mb-1.5">DATE</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[13px] outline-none focus:border-[#2B7FFF]" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.5px] block mb-1.5">MAXIMUM PRICE</label>
              <div className="flex items-center gap-1">
                <span className="text-[13px] text-[#9CA3AF]">$</span>
                <input type="number" className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-[13px] outline-none focus:border-[#2B7FFF]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </main>
  );
}
