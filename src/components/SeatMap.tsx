'use client';

interface SeatMapProps {
  venueName: string;
  sections?: { name: string; minPrice?: number }[];
  selectedSection?: string | null;
  onSectionClick?: (section: string | null) => void;
}

const SECTIONS = [
  { id: 'north-stand', label: 'North Stand', x: 80, y: 10, w: 240, h: 50, rx: 8 },
  { id: 'south-stand', label: 'South Stand', x: 80, y: 290, w: 240, h: 50, rx: 8 },
  { id: 'east-stand', label: 'East Stand', x: 330, y: 70, w: 50, h: 210, rx: 8 },
  { id: 'west-stand', label: 'West Stand', x: 20, y: 70, w: 50, h: 210, rx: 8 },
  { id: 'nw-corner', label: 'NW', x: 20, y: 10, w: 50, h: 50, rx: 8 },
  { id: 'ne-corner', label: 'NE', x: 330, y: 10, w: 50, h: 50, rx: 8 },
  { id: 'sw-corner', label: 'SW', x: 20, y: 290, w: 50, h: 50, rx: 8 },
  { id: 'se-corner', label: 'SE', x: 330, y: 290, w: 50, h: 50, rx: 8 },
];

function getPriceColor(sectionId: string, sections?: { name: string; minPrice?: number }[]): string {
  if (!sections || sections.length === 0) return '#94A3B8';
  const match = sections.find(s => s.name.toLowerCase().includes(sectionId.split('-')[0]));
  if (!match || !match.minPrice) return '#94A3B8';
  if (match.minPrice > 200) return '#EF4444';
  if (match.minPrice > 100) return '#2B7FFF';
  return '#22C55E';
}

export default function SeatMap({ venueName, sections, selectedSection, onSectionClick }: SeatMapProps) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6">
      <h3 className="text-[16px] font-bold text-[#171717] mb-1">{venueName}</h3>
      <p className="text-[13px] text-[#9CA3AF] mb-4">Seat Map</p>

      <svg viewBox="0 0 400 350" className="w-full" xmlns="http://www.w3.org/2000/svg">
        {/* Field */}
        <rect x="80" y="70" width="240" height="210" rx="4" fill="#22C55E" opacity="0.15" stroke="#22C55E" strokeWidth="1.5"/>
        <rect x="110" y="100" width="180" height="150" rx="2" fill="none" stroke="#22C55E" strokeWidth="1" opacity="0.5"/>
        <line x1="200" y1="100" x2="200" y2="250" stroke="#22C55E" strokeWidth="1" opacity="0.5"/>
        <circle cx="200" cy="175" r="30" fill="none" stroke="#22C55E" strokeWidth="1" opacity="0.5"/>

        {/* Sections */}
        {SECTIONS.map(sec => {
          const isSelected = selectedSection === sec.id;
          const color = getPriceColor(sec.id, sections);
          return (
            <g
              key={sec.id}
              className="cursor-pointer"
              onClick={() => onSectionClick?.(isSelected ? null : sec.id)}
            >
              <rect
                x={sec.x} y={sec.y} width={sec.w} height={sec.h} rx={sec.rx}
                fill={isSelected ? color : `${color}33`}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                className="transition-all duration-200 hover:opacity-80"
              />
              <text
                x={sec.x + sec.w / 2} y={sec.y + sec.h / 2 + 4}
                textAnchor="middle"
                className="text-[10px] font-semibold pointer-events-none select-none"
                fill={isSelected ? '#FFF' : '#374151'}
              >
                {sec.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[11px] text-[#6B7280]">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#22C55E]" /> Budget</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#2B7FFF]" /> Mid</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#EF4444]" /> Premium</div>
      </div>

      {selectedSection && (
        <button
          onClick={() => onSectionClick?.(null)}
          className="mt-3 text-[12px] text-[#2B7FFF] hover:underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
