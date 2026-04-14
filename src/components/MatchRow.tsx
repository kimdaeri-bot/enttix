import Link from 'next/link';

interface MatchRowProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  venue: string;
  city: string;
  startingPrice: number;
  currency: string;
  ticketsLeft: number;
}

export default function MatchRow({ id, homeTeam, awayTeam, datetime, venue, city, startingPrice, currency, ticketsLeft }: MatchRowProps) {
  const date = new Date(datetime);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const currencySymbol = (c: string) => {
    if (c === 'GBP') return '£';
    if (c === 'EUR') return '€';
    if (c === 'USD') return '$';
    return c + ' ';
  };

  const priceDisplay = startingPrice > 0
    ? `From ${currencySymbol(currency)}${startingPrice.toFixed(2)}`
    : null;

  return (
    <Link
      href={`/event/${id}`}
      className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-xl px-4 py-4 mb-3 hover:shadow-md transition-shadow group"
    >
      {/* Date Box */}
      <div className="flex-shrink-0 w-[60px] bg-[#F3F4F6] rounded-lg flex flex-col items-center justify-center py-2 px-1 text-center">
        <span className="text-[11px] font-semibold text-[#6B7280] uppercase leading-tight">{month}</span>
        <span className="text-[24px] font-extrabold text-[#171717] leading-none">{day}</span>
        <span className="text-[11px] font-medium text-[#9CA3AF] leading-tight">{year}</span>
      </div>

      {/* Match Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-[#171717] leading-snug mb-1">
          {homeTeam} vs {awayTeam}
        </div>
        <div className="text-[12px] text-[#6B7280]">
          {weekday}, {time} &bull; {venue}, {city}, United Kingdom
        </div>
        {ticketsLeft > 0 && ticketsLeft <= 10 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[10px] font-semibold text-[#EF4444]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
              SELLING FAST
            </span>
            <span className="text-[11px] text-[#6B7280]">Only {ticketsLeft} tickets left</span>
          </div>
        )}
      </div>

      {/* Price + Arrow */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {priceDisplay && (
          <span className="text-[14px] font-semibold text-[#171717] whitespace-nowrap">{priceDisplay}</span>
        )}
        <div className="w-8 h-8 rounded-full bg-[#171717] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2B7FFF] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
