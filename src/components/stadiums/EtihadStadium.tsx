import React from 'react';
import { StadiumSection, SectionProps, StadiumModule } from './types';

export const VIEWBOX = '0 0 800 700';

const CX = 400, CY = 350;
const SX = 1.2, SY = 1.0; // horizontal stretch for oval shape
const INNER = 118;         // inner ring radius (base)
const OUTER_LOW = 172;     // outer of lower tier / inner of upper
const OUTER_UP = 228;      // outer of upper tier
const MID_LOW = (INNER + OUTER_LOW) / 2;    // ~145 — label radius for lower
const MID_UP = (OUTER_LOW + OUTER_UP) / 2;  // ~200 — label radius for upper

// 0° = right, 90° = down, 180° = left, 270° = up (SVG y-down)
function describeArc(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startDeg: number, endDeg: number,
  scaleX = SX, scaleY = SY
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (r: number, a: number) => ({
    x: cx + r * scaleX * Math.cos(toRad(a)),
    y: cy + r * scaleY * Math.sin(toRad(a)),
  });
  const span = (endDeg - startDeg + 360) % 360;
  const large = span > 180 ? 1 : 0;
  const o1 = pt(outerR, startDeg), o2 = pt(outerR, endDeg);
  const i1 = pt(innerR, startDeg), i2 = pt(innerR, endDeg);
  const orx = (outerR * scaleX).toFixed(1), ory = (outerR * scaleY).toFixed(1);
  const irx = (innerR * scaleX).toFixed(1), iry = (innerR * scaleY).toFixed(1);
  return [
    `M ${o1.x.toFixed(1)} ${o1.y.toFixed(1)}`,
    `A ${orx} ${ory} 0 ${large} 1 ${o2.x.toFixed(1)} ${o2.y.toFixed(1)}`,
    `L ${i2.x.toFixed(1)} ${i2.y.toFixed(1)}`,
    `A ${irx} ${iry} 0 ${large} 0 ${i1.x.toFixed(1)} ${i1.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

function labelPos(midDeg: number, midR: number, scaleX = SX, scaleY = SY) {
  const rad = (midDeg * Math.PI) / 180;
  return {
    labelX: CX + midR * scaleX * Math.cos(rad),
    labelY: CY + midR * scaleY * Math.sin(rad),
  };
}

function mid(start: number, end: number): number {
  if (end >= start) return (start + end) / 2;
  return ((start + end + 360) / 2) % 360; // wrap-aware
}

// ---- Section definitions ----
// North Stand (top): 215° → 325° (110° arc, long side of oval)
// South Stand (bottom): 35° → 145°
// West Stand (left, Colin Bell): 145° → 215°
// East Stand (right, goal end): 325° → 35° (70°, wraps through 0°)

const sections: StadiumSection[] = [
  // ── North Stand Lower (9 blocks) ──────────────────────────────────────────
  ...([
    ['block-108', 'Block 108', 215, 222],
    ['block-109', 'Block 109', 222, 229],
    ['block-110', 'Block 110', 229, 236],
    ['block-111', 'Block 111', 236, 258],
    ['block-112', 'Block 112', 258, 270],
    ['block-113', 'Block 113', 270, 292],
    ['block-114', 'Block 114', 292, 299],
    ['block-115', 'Block 115', 299, 311],
    ['block-116', 'Block 116', 311, 325],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, INNER, OUTER_LOW, s, e),
    ...labelPos(mid(s, e), MID_LOW),
  })),

  // ── North Stand Upper (3 blocks) ─────────────────────────────────────────
  ...([
    ['block-211', 'Block 211', 215, 252],
    ['block-212', 'Block 212', 252, 288],
    ['block-213', 'Block 213', 288, 325],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW, OUTER_UP, s, e),
    ...labelPos(mid(s, e), MID_UP),
  })),

  // ── South Stand Lower (7 blocks) ─────────────────────────────────────────
  ...([
    ['block-104', 'Block 104', 35, 48],
    ['block-105', 'Block 105', 48, 61],
    ['block-101', 'Block 101', 61, 83],
    ['block-102', 'Block 102', 83, 97],
    ['block-103', 'Block 103', 97, 119],
    ['block-106', 'Block 106', 119, 132],
    ['block-107', 'Block 107', 132, 145],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, INNER, OUTER_LOW, s, e),
    ...labelPos(mid(s, e), MID_LOW),
  })),

  // ── South Stand Upper (3 blocks) ─────────────────────────────────────────
  ...([
    ['block-201', 'Block 201', 35, 72],
    ['block-202', 'Block 202', 72, 108],
    ['block-203', 'Block 203', 108, 145],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW, OUTER_UP, s, e),
    ...labelPos(mid(s, e), MID_UP),
  })),

  // ── West Stand / Colin Bell Stand Lower (3 blocks) ───────────────────────
  ...([
    ['block-121', 'Block 121', 145, 168],
    ['block-122', 'Block 122', 168, 192],
    ['block-123', 'Block 123', 192, 215],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, INNER, OUTER_LOW, s, e),
    ...labelPos(mid(s, e), MID_LOW),
  })),

  // ── West Stand Upper (3 blocks) ──────────────────────────────────────────
  ...([
    ['block-221', 'Block 221', 145, 168],
    ['block-222', 'Block 222 (VIP)', 168, 192],
    ['block-223', 'Block 223', 192, 215],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW, OUTER_UP, s, e),
    ...labelPos(mid(s, e), MID_UP),
  })),

  // ── Club Level West (extra tier, center of west) ─────────────────────────
  {
    id: 'club-level-west',
    label: 'Club Level',
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW - 2, OUTER_LOW + 30, 155, 205),
    ...labelPos(mid(155, 205), OUTER_LOW + 14),
  },

  // ── East Stand Lower (4 blocks, wraps through 0°) ────────────────────────
  ...([
    ['block-117', 'Block 117', 325, 342],
    ['block-118', 'Block 118', 342, 359],
    ['block-119', 'Block 119', 359, 18],
    ['block-120', 'Block 120', 18, 35],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, INNER, OUTER_LOW, s, e),
    ...labelPos(mid(s, e), MID_LOW),
  })),

  // ── East Stand Upper (4 blocks) ──────────────────────────────────────────
  ...([
    ['block-217', 'Block 217', 325, 342],
    ['block-218', 'Block 218', 342, 359],
    ['block-219', 'Block 219', 359, 18],
    ['block-220', 'Block 220', 18, 35],
  ] as const).map(([id, label, s, e]) => ({
    id,
    label,
    type: 'path' as const,
    d: describeArc(CX, CY, OUTER_LOW, OUTER_UP, s, e),
    ...labelPos(mid(s, e), MID_UP),
  })),
];

export const SECTIONS: StadiumSection[] = sections;

// ── Field (pitch) component ──────────────────────────────────────────────────
export function Field(): React.ReactElement {
  const lw = 0.9;
  const lo = 0.45;
  // Pitch rectangle centred at (400, 350): w=240, h=200
  const px = 280, py = 250, pw = 240, ph = 200;
  const pcx = px + pw / 2, pcy = py + ph / 2; // 400, 350
  // Penalty box dimensions (relative to goal line)
  const pbW = 55, pbH = 110, pbX1 = px, pbX2 = px + pw - pbW;
  const pbY = pcy - pbH / 2;
  // Goal box
  const gbW = 22, gbH = 66;
  const gbX1 = px, gbX2 = px + pw - gbW;
  const gbY = pcy - gbH / 2;

  return (
    <g>
      {/* Pitch background */}
      <rect x={px} y={py} width={pw} height={ph} rx={5}
        fill="#16a34a" fillOpacity={0.18} stroke="#22c55e" strokeWidth={1.2} />
      {/* Pitch outer lines */}
      <rect x={px} y={py} width={pw} height={ph} rx={2}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Halfway line */}
      <line x1={pcx} y1={py} x2={pcx} y2={py + ph}
        stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Centre circle */}
      <circle cx={pcx} cy={pcy} r={34}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Centre spot */}
      <circle cx={pcx} cy={pcy} r={3} fill="#22c55e" fillOpacity={0.5} />
      {/* Left penalty box */}
      <rect x={pbX1} y={pbY} width={pbW} height={pbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Right penalty box */}
      <rect x={pbX2} y={pbY} width={pbW} height={pbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Left goal box */}
      <rect x={gbX1} y={gbY} width={gbW} height={gbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Right goal box */}
      <rect x={gbX2} y={gbY} width={gbW} height={gbH}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Penalty spots */}
      <circle cx={px + 44} cy={pcy} r={2.5} fill="#22c55e" fillOpacity={0.4} />
      <circle cx={px + pw - 44} cy={pcy} r={2.5} fill="#22c55e" fillOpacity={0.4} />
      {/* Corner arcs */}
      <path d={`M ${px} ${py + 8} A 8 8 0 0 1 ${px + 8} ${py}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${px + pw} ${py + 8} A 8 8 0 0 0 ${px + pw - 8} ${py}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${px} ${py + ph - 8} A 8 8 0 0 0 ${px + 8} ${py + ph}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      <path d={`M ${px + pw} ${py + ph - 8} A 8 8 0 0 1 ${px + pw - 8} ${py + ph}`}
        fill="none" stroke="#22c55e" strokeWidth={lw} strokeOpacity={lo} />
      {/* Stand direction labels */}
      <text x={pcx} y={py - 12} textAnchor="middle" fontSize={10} fill="#6B7280" fontWeight="600">
        NORTH STAND
      </text>
      <text x={pcx} y={py + ph + 20} textAnchor="middle" fontSize={10} fill="#6B7280" fontWeight="600">
        SOUTH STAND
      </text>
      <text x={px - 14} y={pcy + 3} textAnchor="middle" fontSize={9} fill="#6B7280" fontWeight="600"
        transform={`rotate(-90, ${px - 14}, ${pcy})`}>
        WEST
      </text>
      <text x={px + pw + 14} y={pcy + 3} textAnchor="middle" fontSize={9} fill="#6B7280" fontWeight="600"
        transform={`rotate(90, ${px + pw + 14}, ${pcy})`}>
        EAST
      </text>
    </g>
  );
}

// ── Section renderer ─────────────────────────────────────────────────────────
export function Section({
  section, fill, fillOpacity, stroke, strokeWidth, showLabel,
}: SectionProps): React.ReactElement {
  if (section.type === 'path') {
    const fontSize = 8.5;
    const shortLabel = section.label.replace('Block ', '').replace(' (VIP)', '★');
    return (
      <g>
        <path
          d={section.d}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          style={{ transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
        />
        {showLabel && (
          <text
            x={section.labelX}
            y={section.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight="600"
            fill={fillOpacity > 0.5 ? '#fff' : '#374151'}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {shortLabel}
          </text>
        )}
      </g>
    );
  }
  // rect fallback (shouldn't appear for Etihad)
  const s = section as { x: number; y: number; w: number; h: number; rx2?: number; labelX: number; labelY: number; label: string };
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx2 ?? 4}
        fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      {showLabel && (
        <text x={s.labelX} y={s.labelY} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fill="#374151" style={{ pointerEvents: 'none' }}>
          {s.label}
        </text>
      )}
    </g>
  );
}

const EtihadStadium: StadiumModule = { VIEWBOX, SECTIONS, Field, Section };
export default EtihadStadium;
