import Link from 'next/link';

interface MatchCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  startingPrice: number;
  currency: string;
}

export default function MatchCard({ id, homeTeam, awayTeam, datetime, startingPrice, currency }: MatchCardProps) {
  const date = new Date(datetime);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();

  return (
    <Link href={`/event/${id}`} className="block min-w-[260px] max-w-[300px] flex-shrink-0">
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] hover:border-[#2B7FFF] hover:shadow-lg transition-all overflow-hidden">
        {/* Top blue bar */}
        <div className="bg-[#0F172A] px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#DBEAFE] tracking-[0.5px]">TICKET</span>
          <span className="text-[11px] font-medium text-[#94A3B8]">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </span>
        </div>
        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-center flex-1">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] mx-auto mb-2 flex items-center justify-center text-[12px] font-bold text-[#475569]">
                {homeTeam.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
              <p className="text-[13px] font-semibold text-[#171717] leading-[16px]">{homeTeam}</p>
            </div>
            <span className="text-[14px] font-bold text-[#94A3B8]">VS</span>
            <div className="text-center flex-1">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] mx-auto mb-2 flex items-center justify-center text-[12px] font-bold text-[#475569]">
                {awayTeam.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
              <p className="text-[13px] font-semibold text-[#171717] leading-[16px]">{awayTeam}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[20px] font-bold text-[#2B7FFF]">
              ${startingPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
