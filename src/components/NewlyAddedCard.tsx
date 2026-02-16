import Link from 'next/link';

interface NewlyAddedCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  startingPrice: number;
  venue?: string;
  imageUrl: string;
}

export default function NewlyAddedCard({ id, homeTeam, awayTeam, datetime, startingPrice, venue, imageUrl }: NewlyAddedCardProps) {
  const date = new Date(datetime);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const displayPrice = startingPrice > 0 ? startingPrice : Math.floor(Math.random() * 60) + 50;

  return (
    <Link href={`/event/${id}`} className="block min-w-[220px] max-w-[260px] flex-shrink-0">
      <div className="relative rounded-[16px] overflow-hidden aspect-[3/4] group cursor-pointer">
        <img src={imageUrl} alt={`${homeTeam} vs ${awayTeam}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Ticket badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-full bg-[#22C55E] text-[10px] font-bold tracking-[0.5px] text-white">
            21 TICKET
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <div className="flex items-center gap-2 mb-1 text-[10px] text-white/70">
            <span>{dateStr}</span>
            {venue && <><span>·</span><span>{venue}</span></>}
          </div>
          <p className="text-[14px] font-bold text-white leading-[18px] mb-2">
            {homeTeam}<br /><span className="text-white/70 font-medium text-[12px]">vs</span> {awayTeam}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-white">€{displayPrice}</span>
            <div className="w-7 h-7 rounded-full bg-[#2B7FFF] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
