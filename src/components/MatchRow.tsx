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

export default function MatchRow({ id, homeTeam, awayTeam, datetime, venue, city, startingPrice, ticketsLeft }: MatchRowProps) {
  const date = new Date(datetime);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();

  return (
    <Link href={`/event/${id}`} className="match-row group">
      {/* Date */}
      <div className="text-center">
        <div className="text-[13px] font-bold text-[#2B7FFF] leading-[16px]">{month}</div>
        <div className="text-[28px] font-extrabold text-[#171717] leading-[32px]">{day}</div>
      </div>

      {/* Teams */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[15px] font-semibold text-[#171717]">{homeTeam}</span>
          <span className="text-[13px] text-[#94A3B8]">vs</span>
          <span className="text-[15px] font-semibold text-[#171717]">{awayTeam}</span>
        </div>
        {ticketsLeft <= 10 && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[11px] font-semibold text-[#EF4444]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
              SELLING FAST
            </span>
            <span className="text-[12px] text-[#6B7280]">Only {ticketsLeft} tickets left</span>
          </div>
        )}
        {/* Venue - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 text-[13px] text-[#6B7280]">
          <span className="font-medium text-[#9CA3AF]">VENUE</span>
          <span>{venue}</span>
        </div>
      </div>

      {/* Venue - desktop */}
      <div className="hidden md:block">
        <div className="text-[13px] text-[#6B7280]">{city}</div>
      </div>

      {/* Price */}
      <div className="text-right">
        <div className="text-[11px] font-medium text-[#9CA3AF] mb-0.5 hidden md:block">STARTING FROM</div>
        <div className="text-[18px] font-bold text-[#171717]">${Math.round(startingPrice)}</div>
      </div>
    </Link>
  );
}
