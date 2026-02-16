import Link from 'next/link';

interface TrendingCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  startingPrice: number;
  currency: string;
  badge?: string;
  badgeColor?: 'red' | 'green';
  league?: string;
  imageUrl: string;
}

export default function TrendingCard({ id, homeTeam, awayTeam, datetime, startingPrice, badge, badgeColor = 'red', league, imageUrl }: TrendingCardProps) {
  const date = new Date(datetime);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  const displayPrice = startingPrice > 0 ? startingPrice : Math.floor(Math.random() * 300) + 80;

  return (
    <Link href={`/event/${id}`} className="block min-w-[240px] max-w-[280px] flex-shrink-0">
      <div className="relative rounded-[16px] overflow-hidden aspect-[4/5] group cursor-pointer">
        {/* Background Image */}
        <img src={imageUrl} alt={`${homeTeam} vs ${awayTeam}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.5px] text-white ${badgeColor === 'red' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}>
              {badge}
            </span>
          </div>
        )}

        {/* Content at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <div className="flex items-center gap-2 mb-1.5 text-[11px] text-white/70">
            <span>📅 {dateStr}</span>
          </div>
          {league && <p className="text-[11px] font-semibold text-[#2B7FFF] tracking-[0.5px] mb-1">{league}</p>}
          <p className="text-[14px] font-bold text-white leading-[18px] mb-2">
            {homeTeam} {awayTeam ? `vs ${awayTeam}` : ''}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-white">From £{displayPrice}</span>
            <div className="w-8 h-8 rounded-full bg-[#2B7FFF] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
