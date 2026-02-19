import React from 'react';
import { StadiumSection, SectionProps, StadiumModule } from './types';

export const VIEWBOX = '0 0 800 700';

// Generic stadium: 4 stands split into labelled rect blocks
// Layout uses the same 800×700 viewBox with a centred pitch

const PX = 265, PY = 240, PW = 270, PH = 220; // pitch rect
const PCX = PX + PW / 2; // 400
const PCY = PY + PH / 2; // 350

// Stands
const STAND_W = 58;  // side stand width (east/west)
const STAND_H = 50;  // end stand height (north/south)
const GAP = 6;

const NORTH_Y = PY - STAND_H - GAP;
const SOUTH_Y = PY + PH + GAP;
const WEST_X  = PX - STAND_W - GAP;
const EAST_X  = PX + PW + GAP;

function makeRow(
  ids: string[],
  labels: string[],
  startX: number,
  y: number,
  totalW: number,
  h: number,
  rx2 = 5
): StadiumSection[] {
  const n = ids.length;
  const cellW = (totalW - (n - 1) * 2) / n;
  return ids.map((id, i) => ({
    id,
    label: labels[i],
    type: 'rect' as const,
    x: startX + i * (cellW + 2),
    y,
    w: cellW,
    h,
    rx2,
    labelX: startX + i * (cellW + 2) + cellW / 2,
    labelY: y + h / 2,
  }));
}

function makeCol(
  ids: string[],
  labels: string[],
  x: number,
  startY: number,
  w: number,
  totalH: number,
  rx2 = 5
): StadiumSection[] {
  const n = ids.length;
  const cellH = (totalH - (n - 1) * 2) / n;
  return ids.map((id, i) => ({
    id,
    label: labels[i],
    type: 'rect' as const,
    x,
    y: startY + i * (cellH + 2),
    w,
    h: cellH,
    rx2,
    labelX: x + w / 2,
    labelY: startY + i * (cellH + 2) + cellH / 2,
  }));
}

export const SECTIONS: StadiumSection[] = [
  // North Stand (top) — 5 blocks
  ...makeRow(
    ['north-1','north-2','north-3','north-4','north-5'],
    ['N1','N2','N3','N4','N5'],
    PX, NORTH_Y, PW, STAND_H
  ),
  // South Stand (bottom) — 5 blocks
  ...makeRow(
    ['south-1','south-2','south-3','south-4','south-5'],
    ['S1','S2','S3','S4','S5'],
    PX, SOUTH_Y, PW, STAND_H
  ),
  // West Stand (left) — 5 blocks
  ...makeCol(
    ['west-1','west-2','west-3','west-4','west-5'],
    ['W1','W2','W3','W4','W5'],
    WEST_X, PY, STAND_W, PH
  ),
  // East Stand (right) — 5 blocks
  ...makeCol(
    ['east-1','east-2','east-3','east-4','east-5'],
    ['E1','E2','E3','E4','E5'],
    EAST_X, PY, STAND_W, PH
  ),
  // Corners (small)
  { id: 'corner-nw', label: 'NW', type: 'rect', x: WEST_X,  y: NORTH_Y, w: STAND_W, h: STAND_H, rx2: 5, labelX: WEST_X + STAND_W/2,  labelY: NORTH_Y + STAND_H/2 },
  { id: 'corner-ne', label: 'NE', type: 'rect', x: EAST_X,  y: NORTH_Y, w: STAND_W, h: STAND_H, rx2: 5, labelX: EAST_X + STAND_W/2,  labelY: NORTH_Y + STAND_H/2 },
  { id: 'corner-sw', label: 'SW', type: 'rect', x: WEST_X,  y: SOUTH_Y, w: STAND_W, h: STAND_H, rx2: 5, labelX: WEST_X + STAND_W/2,  labelY: SOUTH_Y + STAND_H/2 },
  { id: 'corner-se', label: 'SE', type: 'rect', x: EAST_X,  y: SOUTH_Y, w: STAND_W, h: STAND_H, rx2: 5, labelX: EAST_X + STAND_W/2,  labelY: SOUTH_Y + STAND_H/2 },
];

// ── Field (pitch) component ──────────────────────────────────────────────────
export function Field(): React.ReactElement {
  const lw = 0.9, lo = 0.45;
  const pcx = PCX, pcy = PCY;
  const pbW = 56, pbH = 108;
  const pbX1 = PX, pbX2 = PX + PW - pbW;
  const pbY = pcy - pbH / 2;
  const gbW = 22, gbH = 64;
  const gbX1 = PX, gbX2 = PX + PW - gbW;
  const gbY = pcy - gbH / 2;

  return (
    <g>
      <rect x={PX} y={PY} width={PW} height={PH} rx={6}
        fill="#16a34a" fillOpacity={0.18} stroke="#22c55e" strokeWidth={1.2} />
      <rect x={PX} y={PY} width={PW} height={PH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <line x1={pcx} y1={PY} x2={pcx} y2={PY + PH}
        stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <circle cx={pcx} cy={pcy} r={35}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <circle cx={pcx} cy={pcy} r={3} fill="#22c55e" fillOpacity={0.5} />
      <rect x={pbX1} y={pbY} width={pbW} height={pbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <rect x={pbX2} y={pbY} width={pbW} height={pbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <rect x={gbX1} y={gbY} width={gbW} height={gbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <rect x={gbX2} y={gbY} width={gbW} height={gbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <circle cx={PX + 46} cy={pcy} r={2.5} fill="#22c55e" fillOpacity={0.4} />
      <circle cx={PX + PW - 46} cy={pcy} r={2.5} fill="#22c55e" fillOpacity={0.4} />
      {/* Corner arcs */}
      <path d={`M ${PX} ${PY + 8} A 8 8 0 0 1 ${PX + 8} ${PY}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${PX+PW} ${PY+8} A 8 8 0 0 0 ${PX+PW-8} ${PY}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${PX} ${PY+PH-8} A 8 8 0 0 0 ${PX+8} ${PY+PH}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${PX+PW} ${PY+PH-8} A 8 8 0 0 1 ${PX+PW-8} ${PY+PH}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Direction labels */}
      <text x={PCX} y={NORTH_Y - 8} textAnchor="middle" fontSize={10} fill="#6B7280" fontWeight="600">NORTH STAND</text>
      <text x={PCX} y={SOUTH_Y + STAND_H + 16} textAnchor="middle" fontSize={10} fill="#6B7280" fontWeight="600">SOUTH STAND</text>
      <text x={WEST_X - 10} y={PCY} textAnchor="middle" fontSize={9} fill="#6B7280" fontWeight="600"
        transform={`rotate(-90, ${WEST_X - 10}, ${PCY})`}>WEST</text>
      <text x={EAST_X + STAND_W + 10} y={PCY} textAnchor="middle" fontSize={9} fill="#6B7280" fontWeight="600"
        transform={`rotate(90, ${EAST_X + STAND_W + 10}, ${PCY})`}>EAST</text>
    </g>
  );
}

// ── Section renderer ─────────────────────────────────────────────────────────
export function Section({
  section, fill, fillOpacity, stroke, strokeWidth, showLabel,
}: SectionProps): React.ReactElement {
  if (section.type === 'rect') {
    return (
      <g>
        <rect
          x={section.x} y={section.y} width={section.w} height={section.h}
          rx={section.rx2 ?? 5}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
          style={{ transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
        />
        {showLabel && section.w > 20 && section.h > 14 && (
          <text
            x={section.labelX}
            y={section.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight="600"
            fill={fillOpacity > 0.5 ? '#fff' : '#374151'}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {section.label}
          </text>
        )}
      </g>
    );
  }
  // path fallback
  const s = section as { d: string; labelX: number; labelY: number; label: string };
  return (
    <g>
      <path d={s.d} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      {showLabel && (
        <text x={s.labelX} y={s.labelY} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fill="#374151" style={{ pointerEvents: 'none' }}>
          {s.label}
        </text>
      )}
    </g>
  );
}

const GenericStadium: StadiumModule = { VIEWBOX, SECTIONS, Field, Section };
export default GenericStadium;
