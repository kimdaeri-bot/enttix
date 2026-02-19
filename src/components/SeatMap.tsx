'use client';

import { useState, useRef } from 'react';

interface SeatSection {
  name: string;
  minPrice?: number;
  count?: number;
}

interface SeatMapProps {
  venueName: string;
  sections?: SeatSection[];
  selectedSection?: string | null;
  onSectionClick?: (section: string | null) => void;
  compact?: boolean;
  highlightSection?: string;
}

type Position = 'north' | 'south' | 'east' | 'west' | 'ne' | 'nw' | 'se' | 'sw' | 'center' | 'unknown';

function inferPosition(name: string): Position {
  const n = name.toLowerCase();

  // Composite directions first
  if ((n.includes('north') || n.includes('upper')) && (n.includes('east') || n.includes('right'))) return 'ne';
  if ((n.includes('north') || n.includes('upper')) && (n.includes('west') || n.includes('left'))) return 'nw';
  if ((n.includes('south') || n.includes('lower')) && (n.includes('east') || n.includes('right'))) return 'se';
  if ((n.includes('south') || n.includes('lower')) && (n.includes('west') || n.includes('left'))) return 'sw';

  // Single cardinal directions
  if (n.includes('north')) return 'north';
  if (n.includes('south')) return 'south';
  if (n.includes('east')) return 'east';
  if (n.includes('west')) return 'west';
  if (n === 'top' || n.startsWith('upper ')) return 'north';
  if (n === 'bottom' || n.startsWith('lower ')) return 'south';
  if (n.includes(' right')) return 'east';
  if (n.includes(' left')) return 'west';

  // Abbreviations
  if (/\bne\b/.test(n)) return 'ne';
  if (/\bnw\b/.test(n)) return 'nw';
  if (/\bse\b/.test(n)) return 'se';
  if (/\bsw\b/.test(n)) return 'sw';

  // Premium/VIP zones → center overlay on field
  if (
    n.includes('vip') || n.includes('club') || n.includes('executive') ||
    n.includes('hospitality') || n.includes('premium') || n.includes('corporate') ||
    n.includes('director') || n.includes('suite') || n.includes('skybox')
  ) return 'center';

  return 'unknown';
}

function getPriceColor(price: number | undefined, allPrices: number[]): string {
  if (price === undefined || !isFinite(price) || allPrices.length === 0) return '#94A3B8';
  const valid = allPrices.filter(p => isFinite(p));
  if (valid.length === 0) return '#94A3B8';
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (max === min) return '#22C55E';
  const ratio = (price - min) / (max - min);
  if (ratio < 0.2) return '#22C55E';
  if (ratio < 0.4) return '#84CC16';
  if (ratio < 0.6) return '#F59E0B';
  if (ratio < 0.8) return '#F97316';
  return '#EF4444';
}

function formatPrice(price?: number): string {
  if (price === undefined || !isFinite(price)) return '';
  return `£${price.toFixed(2)}`;
}

function abbreviateLabel(name: string, maxChars: number): string {
  if (name.length <= maxChars) return name;
  const words = name.split(' ');
  if (words.length > 1) {
    const acronym = words.map(w => w[0]).join('').toUpperCase();
    if (acronym.length <= 4) return acronym;
    // First word truncated
    const first = words[0];
    if (first.length <= maxChars) return first;
    return first.slice(0, maxChars - 1) + '…';
  }
  return name.slice(0, maxChars - 1) + '…';
}

interface SectionRect {
  section: SeatSection;
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
}

// SVG layout constants
const FL = 80, FR = 320;   // field X bounds
const FT = 70, FB = 280;   // field Y bounds
const FW = FR - FL;        // 240
const FH = FB - FT;        // 210

const NORTH_Y = 8,  NORTH_H = 52;
const SOUTH_Y = 290, SOUTH_H = 52;
const EAST_X = 332,  EAST_W = 58;
const WEST_X = 10,   WEST_W = 58;
const CORNER_W = 58, CORNER_H = 52;

function splitH(secs: SeatSection[], startX: number, totalW: number, y: number, h: number, rx = 6): SectionRect[] {
  const n = secs.length;
  return secs.map((s, i) => {
    const cellW = totalW / n;
    return { section: s, x: startX + i * cellW + 1, y, w: cellW - 2, h, rx };
  });
}

function splitV(secs: SeatSection[], x: number, w: number, startY: number, totalH: number, rx = 6): SectionRect[] {
  const n = secs.length;
  return secs.map((s, i) => {
    const cellH = totalH / n;
    return { section: s, x, y: startY + i * cellH + 1, w, h: cellH - 2, rx };
  });
}

function distributeUnknown(secs: SeatSection[], occupied: Set<'north'|'south'|'east'|'west'>): SectionRect[] {
  const result: SectionRect[] = [];
  const n = secs.length;
  if (n === 0) return result;

  const available: Array<'north'|'east'|'south'|'west'> = [];
  if (!occupied.has('north')) available.push('north');
  if (!occupied.has('east'))  available.push('east');
  if (!occupied.has('south')) available.push('south');
  if (!occupied.has('west'))  available.push('west');

  if (available.length === 0) {
    // All sides taken — wrap proportionally
    const nSlots = Math.round(n * FW / (2 * (FW + FH))) || 1;
    const eSlots = Math.round(n * FH / (2 * (FW + FH))) || 1;
    const sSlots = Math.round(n * FW / (2 * (FW + FH))) || 1;
    const wSlots = Math.max(n - nSlots - eSlots - sSlots, 0);
    let idx = 0;
    const take = (count: number) => secs.slice(idx, (idx += count));
    result.push(...splitH(take(nSlots), FL, FW, NORTH_Y, NORTH_H, 4));
    result.push(...splitV(take(eSlots), EAST_X, EAST_W, FT, FH, 4));
    result.push(...splitH(take(sSlots), FL, FW, SOUTH_Y, SOUTH_H, 4));
    result.push(...splitV(take(wSlots), WEST_X, WEST_W, FT, FH, 4));
    return result;
  }

  // Distribute evenly among available sides
  const perSide = Math.ceil(n / available.length);
  let idx = 0;
  for (const side of available) {
    const batch = secs.slice(idx, idx + perSide);
    if (batch.length === 0) break;
    idx += batch.length;
    if (side === 'north') result.push(...splitH(batch, FL, FW, NORTH_Y, NORTH_H));
    else if (side === 'south') result.push(...splitH(batch, FL, FW, SOUTH_Y, SOUTH_H));
    else if (side === 'east') result.push(...splitV(batch, EAST_X, EAST_W, FT, FH));
    else if (side === 'west') result.push(...splitV(batch, WEST_X, WEST_W, FT, FH));
  }
  return result;
}

function buildLayout(sections: SeatSection[]): SectionRect[] {
  if (sections.length === 0) return [];

  const groups: Record<Position, SeatSection[]> = {
    north: [], south: [], east: [], west: [],
    ne: [], nw: [], se: [], sw: [],
    center: [], unknown: [],
  };

  for (const s of sections) {
    groups[inferPosition(s.name)].push(s);
  }

  const result: SectionRect[] = [];

  // Cardinal directions
  if (groups.north.length) result.push(...splitH(groups.north, FL, FW, NORTH_Y, NORTH_H));
  if (groups.south.length) result.push(...splitH(groups.south, FL, FW, SOUTH_Y, SOUTH_H));
  if (groups.east.length)  result.push(...splitV(groups.east, EAST_X, EAST_W, FT, FH));
  if (groups.west.length)  result.push(...splitV(groups.west, WEST_X, WEST_W, FT, FH));

  // Corners
  const cornerPos: Record<'nw'|'ne'|'sw'|'se', { x: number; y: number }> = {
    nw: { x: WEST_X, y: NORTH_Y },
    ne: { x: EAST_X, y: NORTH_Y },
    sw: { x: WEST_X, y: SOUTH_Y },
    se: { x: EAST_X, y: SOUTH_Y },
  };
  for (const pos of ['nw', 'ne', 'sw', 'se'] as const) {
    if (!groups[pos].length) continue;
    const { x, y } = cornerPos[pos];
    groups[pos].forEach((s, i) => {
      const h = CORNER_H / groups[pos].length;
      result.push({ section: s, x, y: y + i * h, w: CORNER_W, h, rx: 4 });
    });
  }

  // Center (VIP/premium) — overlay on field
  if (groups.center.length) {
    const cw = 110, ch = 26;
    const cx = 200 - cw / 2;
    const totalH = groups.center.length * ch + (groups.center.length - 1) * 4;
    const startY = 175 - totalH / 2;
    groups.center.forEach((s, i) => {
      result.push({ section: s, x: cx, y: startY + i * (ch + 4), w: cw, h: ch, rx: 5 });
    });
  }

  // Unknown sections
  const occupied = new Set<'north'|'south'|'east'|'west'>();
  if (groups.north.length) occupied.add('north');
  if (groups.south.length) occupied.add('south');
  if (groups.east.length)  occupied.add('east');
  if (groups.west.length)  occupied.add('west');
  result.push(...distributeUnknown(groups.unknown, occupied));

  return result;
}

export default function SeatMap({
  venueName,
  sections,
  selectedSection,
  onSectionClick,
  compact = false,
  highlightSection,
}: SeatMapProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const layout = buildLayout(sections || []);
  const allPrices = (sections || [])
    .map(s => s.minPrice)
    .filter((p): p is number => p !== undefined && isFinite(p));

  const getColor = (s: SeatSection) => getPriceColor(s.minPrice, allPrices);

  const hoveredData = hoveredSection
    ? (sections || []).find(s => s.name === hoveredSection)
    : null;

  const handleMouseEnter = (name: string, e: React.MouseEvent) => {
    if (compact) return;
    setHoveredSection(name);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseMove = (name: string, e: React.MouseEvent) => {
    if (compact || hoveredSection !== name) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <div className={compact ? '' : 'bg-white rounded-[16px] border border-[#E5E7EB] p-6'}>
      {!compact && (
        <>
          <h3 className="text-[16px] font-bold text-[#171717] mb-1">{venueName}</h3>
          <p className="text-[13px] text-[#9CA3AF] mb-4">Seat Map · click a section to filter</p>
        </>
      )}

      <div ref={containerRef} className="relative select-none">
        <svg
          viewBox="0 0 400 350"
          className={compact ? 'w-full max-h-[160px]' : 'w-full'}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          {/* Pitch */}
          <rect x="80" y="70" width="240" height="210" rx="6"
            fill="#22C55E" fillOpacity="0.11" stroke="#22C55E" strokeWidth="1.5" />
          <rect x="110" y="100" width="180" height="150" rx="2"
            fill="none" stroke="#22C55E" strokeWidth="0.8" strokeOpacity="0.4" />
          <line x1="200" y1="100" x2="200" y2="250"
            stroke="#22C55E" strokeWidth="0.8" strokeOpacity="0.4" />
          <circle cx="200" cy="175" r="30"
            fill="none" stroke="#22C55E" strokeWidth="0.8" strokeOpacity="0.4" />
          <circle cx="200" cy="175" r="3" fill="#22C55E" fillOpacity="0.35" />
          {/* Goal boxes */}
          <rect x="158" y="70" width="84" height="18" rx="2"
            fill="none" stroke="#22C55E" strokeWidth="0.7" strokeOpacity="0.3" />
          <rect x="158" y="262" width="84" height="18" rx="2"
            fill="none" stroke="#22C55E" strokeWidth="0.7" strokeOpacity="0.3" />

          {/* Sections */}
          {layout.map(({ section: s, x, y, w, h, rx }) => {
            const isSelected = !compact && selectedSection === s.name;
            const isHighlighted = compact && highlightSection === s.name;
            const isHovered = !compact && hoveredSection === s.name;
            const color = getColor(s);

            let fillColor = color;
            let fillOpacity = 0.55;
            let strokeW = 1.5;
            let textFill = '#374151';
            let shadowFilter: string | undefined;

            if (compact) {
              if (isHighlighted) {
                fillOpacity = 1;
                strokeW = 2;
                textFill = '#fff';
                shadowFilter = 'drop-shadow(0 2px 6px rgba(43,127,255,0.4))';
              } else {
                fillColor = '#CBD5E1';
                fillOpacity = 0.6;
                strokeW = 1;
                textFill = '#9CA3AF';
              }
            } else if (isSelected) {
              fillOpacity = 1;
              strokeW = 2.5;
              textFill = '#fff';
              shadowFilter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))';
            } else if (isHovered) {
              fillOpacity = 0.85;
              strokeW = 2;
              textFill = '#fff';
            } else if (selectedSection) {
              fillOpacity = 0.18;
              strokeW = 1;
              textFill = '#9CA3AF';
            }

            // Label sizing
            const minDim = Math.min(w, h);
            const fontSize = minDim < 22 ? 7 : minDim < 35 ? 8 : 9;
            const maxLabelChars = w < 55 ? 3 : w < 90 ? 7 : 15;
            const label = abbreviateLabel(s.name, maxLabelChars);

            return (
              <g
                key={s.name}
                className={!compact ? 'cursor-pointer' : ''}
                onClick={() => {
                  if (compact) return;
                  onSectionClick?.(isSelected ? null : s.name);
                }}
                onMouseEnter={(e) => handleMouseEnter(s.name, e)}
                onMouseMove={(e) => handleMouseMove(s.name, e)}
                onMouseLeave={() => { if (!compact) setHoveredSection(null); }}
              >
                <rect
                  x={x} y={y} width={w} height={h} rx={rx}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={compact && !isHighlighted ? '#94A3B8' : color}
                  strokeWidth={strokeW}
                  strokeOpacity={isSelected || isHighlighted || isHovered ? 1 : 0.65}
                  style={{ filter: shadowFilter, transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
                />
                {w > 28 && h > 14 && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + fontSize * 0.38}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight="600"
                    fill={textFill}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Empty state: no sections */}
          {layout.length === 0 && (
            <text x="200" y="175" textAnchor="middle" fontSize="11" fill="#94A3B8">
              No sections available
            </text>
          )}
        </svg>

        {/* Hover Tooltip */}
        {!compact && hoveredData && (
          <div
            className="absolute z-20 bg-[#0F172A] text-white rounded-[8px] px-3 py-2 shadow-xl pointer-events-none leading-snug"
            style={{
              left: tooltipPos.x + 14,
              top: Math.max(tooltipPos.y - 50, 4),
              maxWidth: 190,
              transform: tooltipPos.x > 240 ? 'translateX(calc(-100% - 28px))' : undefined,
            }}
          >
            <p className="text-[13px] font-bold mb-0.5">{hoveredData.name}</p>
            {hoveredData.minPrice !== undefined && isFinite(hoveredData.minPrice) && (
              <p className="text-[11px] text-[#94A3B8]">From {formatPrice(hoveredData.minPrice)}</p>
            )}
            {hoveredData.count !== undefined && hoveredData.count > 0 && (
              <p className="text-[11px] text-[#94A3B8]">{hoveredData.count} tickets available</p>
            )}
            {(hoveredData.minPrice === undefined || !isFinite(hoveredData.minPrice ?? NaN)) &&
              !hoveredData.count && (
              <p className="text-[11px] text-[#94A3B8]">Click to filter</p>
            )}
          </div>
        )}
      </div>

      {/* Price Legend */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: '#22C55E' }} />
            Budget
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: '#F59E0B' }} />
            Mid-range
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: '#EF4444' }} />
            Premium
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: '#94A3B8' }} />
            No price
          </div>
        </div>
      )}

      {/* Compact: seat location label */}
      {compact && highlightSection && (
        <p className="text-center text-[12px] text-[#6B7280] mt-2">
          Your seats:{' '}
          <span className="font-semibold text-[#2B7FFF]">{highlightSection}</span>
        </p>
      )}

      {/* Clear filter */}
      {!compact && selectedSection && (
        <button
          onClick={() => onSectionClick?.(null)}
          className="mt-2 text-[12px] text-[#2B7FFF] hover:underline"
        >
          Clear filter ×
        </button>
      )}
    </div>
  );
}
