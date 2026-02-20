'use client';
import Header from '@/components/Header';
import SeatMap from '@/components/SeatMap';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Match } from '@/types';
// Cart removed — Buy Now direct flow only

interface TicketListing {
  id: string;
  section: string;
  svgSection?: string;  // data-section key for map matching
  row: string;
  seat: string;
  type: string;
  price: number;
  maxQty: number;
  quantityOptions: number[];
  benefits: string[];
  splitWarning?: string;
  isEticket: boolean;
  isAisle: boolean;
  isVip: boolean;
  isGA?: boolean;
}

const demoTickets: TicketListing[] = [
  { id: 't1', section: 'North Stand', row: '12', seat: '1-4', type: 'eTicket', price: 151.45, maxQty: 4, quantityOptions: [1,2,3,4], benefits: [], isEticket: true, isAisle: false, isVip: false },
  { id: 't2', section: 'East Stand', row: '8', seat: '15-16', type: 'eTicket', price: 195.00, maxQty: 2, quantityOptions: [2], benefits: ['Includes unlimited food and drinks'], isEticket: true, isAisle: true, isVip: true, splitWarning: 'Cannot purchase leaving only 1 ticket' },
  { id: 't3', section: 'South Stand', row: 'Standing', seat: 'GA', type: 'eTicket', price: 85.00, maxQty: 8, quantityOptions: [1,2,3,4,5,6,7,8], benefits: [], isEticket: true, isAisle: false, isVip: false },
  { id: 't4', section: 'West Stand', row: '3', seat: '22-23', type: 'Paper', price: 220.00, maxQty: 2, quantityOptions: [1,2], benefits: ['VIP entrance access'], isEticket: false, isAisle: false, isVip: true },
  { id: 't5', section: 'NW Corner', row: '6', seat: '1-6', type: 'eTicket', price: 110.00, maxQty: 6, quantityOptions: [1,2,3,4,5,6], benefits: [], isEticket: true, isAisle: true, isVip: false },
];

function getSplitQuantities(available: number, splitType: string, splitQty?: number): number[] {
  const max = Math.min(available, 10); // 최대 10개 표시
  switch (splitType) {
    case 'avoid-one': return Array.from({ length: max }, (_, i) => i + 1).filter(n => n !== available - 1);
    case 'none': return [available];
    case 'multiples': {
      const step = splitQty && splitQty > 0 ? splitQty : 1;
      return Array.from({ length: Math.floor(max / step) }, (_, i) => (i + 1) * step);
    }
    default: return Array.from({ length: max }, (_, i) => i + 1);
  }
}

export default function EventClient({ id }: { id: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [tickets, setTickets] = useState<TicketListing[]>(demoTickets);
  const [loading, setLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [minQtyFilter, setMinQtyFilter] = useState(1);
  const [sectionFilter, setSectionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedMapSection, setSelectedMapSection] = useState<string | null>(null);
  const [hoveredTicketSection, setHoveredTicketSection] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [expandedBenefits, setExpandedBenefits] = useState<Set<string>>(new Set());
  const toggleBenefits = (id: string) => setExpandedBenefits(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const router = useRouter();
  const seatMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const feedRes = await fetch(`/api/tixstock/feed?event_id=${id}`);
        if (feedRes.ok) {
          const feedData = await feedRes.json();
          const events = feedData.data || [];
          if (events.length > 0) {
            const ev = events[0];
            const name = ev.name || '';
            const parts = name.split(/\s+vs?\s+/i);
            setMatch({
              id: String(ev.id), name, homeTeam: parts[0]?.trim() || name, awayTeam: parts[1]?.trim() || '',
              datetime: ev.datetime || '',
              venue: ev.venue || { id: '', name: '', address_line_1: '', address_line_2: '', city: '', state: '', postcode: '', country_code: '', latitude: 0, longitude: 0 },
              leagueId: '', leagueName: ev.categories?.[0]?.name || '',
              startingPrice: ev.min_ticket_price || 0, currency: ev.currency || 'USD', ticketsLeft: ev.total_tickets || 0,
            });
            if (ev.map_url) setMapUrl(String(ev.map_url));
          }
        }

        const tickRes = await fetch(`/api/tixstock/tickets?event_id=${id}`);
        if (tickRes.ok) {
          const tickData = await tickRes.json();
          const listings = tickData.data || [];
          if (listings.length > 0) {
            setTickets(listings.map((l: Record<string, unknown>) => {
              const seat = (l.seat_details as Record<string, string>) || {};
              const proceedPrice = (l.proceed_price as Record<string, string>) || {};
              const qtyInfo = (l.number_of_tickets_for_sale as Record<string, number>) || {};
              const ticket = (l.ticket as Record<string, unknown>) || {};
              const rb = ((l.restrictions_benefits as Record<string, unknown[]>)?.options || []) as string[];
              const available = qtyInfo.quantity_available || 1;
              const splitType = String(ticket.split_type || 'No Preferences');
              const displayQty = qtyInfo.display_quantity || 0;
              const splitQty = qtyInfo.split_quantity || 0;
              const price = parseFloat(proceedPrice.amount || '0');
              const isGA = String(ticket.general_admission) === 'true';
              return {
                id: String(l.id),
                section: seat.category || seat.section || 'General',
                // SVG data-section key: "{category-slug}_{section-num}"
                svgSection: seat.category && seat.section
                  ? `${seat.category.toLowerCase().replace(/\s+/g, '-')}_${seat.section}`
                  : undefined,
                row: seat.row || '',
                seat: seat.first_seat || '',
                type: String(ticket.type || 'eTicket'),
                price,
                maxQty: displayQty || available,
                quantityOptions: getSplitQuantities(
                  displayQty || available,
                  splitType === 'No Preferences' ? 'any'
                    : splitType === 'All Together' ? 'none'
                    : splitType === 'Avoid leaving one' ? 'avoid-one'
                    : splitType === 'Sell In Multiples' ? 'multiples'
                    : 'any',
                  splitQty,
                ),
                benefits: rb,
                isEticket: String(ticket.type || '').toLowerCase().includes('eticket'),
                isAisle: false,
                isVip: rb.some((r: string) => r.toLowerCase().includes('vip')),
                isGA,
                splitWarning: splitType === 'Avoid leaving one' ? 'Cannot purchase leaving only 1 ticket' : undefined,
              };
            }));
          }
        }
      } catch (e) {
        console.warn('API failed, using demo data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (!loading && !match) {
      import('@/lib/api').then(({ demoData }) => {
        const demo = demoData.matches.find(m => m.id === id);
        if (demo) setMatch(demo);
      });
    }
  }, [loading, match, id]);

  const handleBuyNow = async (ticket: TicketListing, qty: number) => {
    setBuyingId(ticket.id);
    try {
      const res = await fetch('/api/tixstock/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: ticket.id, quantity: qty }),
      });
      const data = await res.json();
      const holdId = data.meta?.hold_id;
      if (!holdId) {
        alert('Hold failed. Please try again.');
        return;
      }
      const isGA = ticket.isGA ?? (ticket.row === 'GA' || ticket.seat === 'GA');
      const benefitsParam = ticket.benefits.length > 0
        ? `&benefits=${encodeURIComponent(JSON.stringify(ticket.benefits))}`
        : '';
      const venueStr = [match?.venue?.name, match?.venue?.city, match?.venue?.country_code].filter(Boolean).join(', ');
      router.push(
        `/sport/checkout?holdId=${holdId}&listingId=${ticket.id}&quantity=${qty}&price=${ticket.price}` +
        `&section=${encodeURIComponent(ticket.section)}&row=${encodeURIComponent(ticket.row)}` +
        `&seat=${encodeURIComponent(ticket.seat)}&eventId=${id}` +
        `&eventName=${encodeURIComponent(match?.name || '')}&general_admission=${isGA}&ticketType=${encodeURIComponent(ticket.type)}` +
        `&eventDate=${encodeURIComponent(match?.datetime || '')}&venue=${encodeURIComponent(venueStr)}` +
        `&mapUrl=${encodeURIComponent(mapUrl || '')}&svgSection=${encodeURIComponent(ticket.svgSection || '')}` +
        benefitsParam
      );
    } catch {
      alert('Hold failed. Please try again.');
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header /></div>
        <div className="flex items-center justify-center py-32">
          <div className="text-[18px] font-semibold text-[#9CA3AF] animate-pulse">Loading event...</div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="bg-[#0F172A]"><Header /></div>
        <div className="flex items-center justify-center py-32 text-[24px] font-bold text-[#6B7280]">Event not found</div>
      </main>
    );
  }

  const date = new Date(match.datetime);
  const sections = [...new Set(tickets.map(t => t.section))];
  const types = [...new Set(tickets.map(t => t.type))];

  // Filter tickets
  const filteredTickets = tickets.filter(t => {
    if (t.maxQty < minQtyFilter) return false;
    if (sectionFilter && t.section !== sectionFilter) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    // Map click: filter by svgSection (data-section key) if set
    if (selectedMapSection && t.svgSection !== selectedMapSection) return false;
    return true;
  });

  // seatMapSections: tickets 변경 시에만 재계산 (useMemo로 참조 안정화 → SeatMap flicker 방지)
  const seatMapSections = useMemo(() => {
    const svgSections = [...new Set(tickets.map(t => t.svgSection).filter(Boolean))] as string[];
    return svgSections.map(svgKey => {
      const sectionTickets = tickets.filter(t => t.svgSection === svgKey);
      const min = Math.min(...sectionTickets.map(t => t.price));
      const count = sectionTickets.reduce((acc, t) => acc + t.maxQty, 0);
      const displayName = sectionTickets[0]?.section || svgKey;
      return { name: svgKey, displayName, minPrice: min, count };
    });
  }, [tickets]);

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header /></div>

      {/* Event Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 py-6">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Home Team Logo */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[16px] font-bold text-[#475569] border-2 border-[#E5E7EB]">
                {match.homeTeam.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
              <p className="text-[12px] font-semibold text-[#374151] mt-1.5 max-w-[80px] truncate">{match.homeTeam}</p>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-[18px] md:text-[22px] font-extrabold text-[#171717]">{match.name}</h1>
              <p className="text-[13px] text-[#6B7280] mt-1">
                {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                <span className="mx-1.5">•</span>
                {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <Link href="#" className="text-[13px] text-[#2B7FFF] hover:underline mt-0.5 inline-block">
                📍 {match.venue.name}{match.venue.city ? `, ${match.venue.city}` : ''}
              </Link>
            </div>

            {/* Away Team Logo */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[16px] font-bold text-[#475569] border-2 border-[#E5E7EB]">
                {match.awayTeam ? match.awayTeam.split(' ').map(w => w[0]).join('').slice(0, 3) : '?'}
              </div>
              <p className="text-[12px] font-semibold text-[#374151] mt-1.5 max-w-[80px] truncate">{match.awayTeam || 'TBD'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-6">
        <div className="flex flex-col-reverse lg:flex-row gap-6">
          {/* LEFT: Ticket Listings (60%) */}
          <div className="flex-1 lg:w-[60%]">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <select value={minQtyFilter} onChange={e => setMinQtyFilter(Number(e.target.value))} className="px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] bg-white">
                <option value={1}>1+ tickets</option>
                <option value={2}>2+ tickets</option>
                <option value={4}>4+ tickets</option>
                <option value={6}>6+ tickets</option>
              </select>
              <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] bg-white">
                <option value="">All Sections</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-[13px] bg-white">
                <option value="">All Ticket Types</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <p className="text-[14px] font-bold text-[#171717] mb-3">{filteredTickets.length} Listings</p>

            {/* Ticket Cards */}
            <div className="flex flex-col gap-3">
              {filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 hover:shadow-md hover:border-[#2B7FFF]/20 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredTicketSection(ticket.svgSection || ticket.section)}
                  onMouseLeave={() => setHoveredTicketSection(null)}
                  onClick={(e) => {
                    // 버튼 클릭은 카드 탭으로 처리하지 않음
                    if ((e.target as HTMLElement).closest('button')) return;
                    // 모바일(lg 미만)에서만 SeatMap으로 스크롤
                    const section = ticket.svgSection || ticket.section;
                    setHoveredTicketSection(section);
                    if (window.innerWidth < 1024 && seatMapRef.current) {
                      seatMapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  {/* Row 1: Icon + Section info + Price */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[8px] bg-[#EFF6FF] flex-shrink-0 flex items-center justify-center mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2">
                          <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 010 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 010-4V7a2 2 0 00-2-2H5z"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[#171717] leading-tight">{ticket.section}</p>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">
                          {ticket.row ? `Row ${ticket.row}` : 'General'}
                          {ticket.seat ? ` · Seat ${ticket.seat}` : ''}
                          {' · '}Up to {ticket.maxQty}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ticket.isEticket && <span className="px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[10px] font-semibold text-[#2B7FFF]">eTicket</span>}
                          {ticket.isVip && <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[10px] font-semibold text-[#D97706]">VIP</span>}
                          {ticket.isAisle && <span className="px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[10px] font-semibold text-[#16A34A]">Aisle</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[18px] font-bold text-[#171717] leading-tight">£{ticket.price.toFixed(2)}</p>
                      <p className="text-[10px] text-[#9CA3AF]">per ticket</p>
                    </div>
                  </div>

                  {/* Row 2: Benefits (collapsible) */}
                  {ticket.benefits.length > 0 && (() => {
                    const isExpanded = expandedBenefits.has(ticket.id);
                    const LIMIT = 4;
                    const shown = isExpanded ? ticket.benefits : ticket.benefits.slice(0, LIMIT);
                    const remaining = ticket.benefits.length - LIMIT;
                    return (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {shown.map((b: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[10px] font-semibold text-[#16A34A]">
                            ✨ {b}
                          </span>
                        ))}
                        {!isExpanded && remaining > 0 && (
                          <button onClick={e => { e.stopPropagation(); toggleBenefits(ticket.id); }}
                            className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[10px] font-semibold text-[#2B7FFF] hover:bg-[#DBEAFE] transition-colors">
                            +{remaining} more
                          </button>
                        )}
                        {isExpanded && (
                          <button onClick={e => { e.stopPropagation(); toggleBenefits(ticket.id); }}
                            className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[10px] font-semibold text-[#64748B] hover:bg-[#E2E8F0] transition-colors">
                            접기 ▲
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {ticket.splitWarning && (
                    <p className="text-[11px] text-[#EF4444] mt-2">⚠️ {ticket.splitWarning}</p>
                  )}

                  {/* Row 3: Qty selector + Buy Now */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const cur = quantities[ticket.id] || ticket.quantityOptions[0] || 1;
                          const idx = ticket.quantityOptions.indexOf(cur);
                          if (idx > 0) setQuantities({ ...quantities, [ticket.id]: ticket.quantityOptions[idx - 1] });
                        }}
                        className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[15px] font-bold text-[#6B7280] hover:bg-[#F1F5F9] transition-colors"
                      >−</button>
                      <span className="w-8 text-center text-[14px] font-bold text-[#171717]">
                        {quantities[ticket.id] || ticket.quantityOptions[0] || 1}
                      </span>
                      <button
                        onClick={() => {
                          const cur = quantities[ticket.id] || ticket.quantityOptions[0] || 1;
                          const idx = ticket.quantityOptions.indexOf(cur);
                          if (idx < ticket.quantityOptions.length - 1) setQuantities({ ...quantities, [ticket.id]: ticket.quantityOptions[idx + 1] });
                        }}
                        className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[15px] font-bold text-[#6B7280] hover:bg-[#F1F5F9] transition-colors"
                      >+</button>
                    </div>
                    <button
                      onClick={() => { const qty = quantities[ticket.id] || ticket.quantityOptions[0] || 1; handleBuyNow(ticket, qty); }}
                      disabled={buyingId === ticket.id}
                      className="flex-1 py-2.5 rounded-[8px] bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[13px] font-semibold transition-colors active:scale-95 disabled:opacity-50"
                    >
                      {buyingId === ticket.id ? 'Processing…' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              ))}

              {filteredTickets.length === 0 && (
                <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-8 text-center text-[#6B7280]">
                  No tickets match your filters.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Seat Map (40%) */}
          <div className="w-full lg:w-[40%] flex-shrink-0 lg:self-start lg:sticky lg:top-4">
            <div ref={seatMapRef}>
              <SeatMap
                venueName={match.venue.name}
                mapUrl={mapUrl || undefined}
                sections={seatMapSections}
                selectedSection={selectedMapSection}
                hoverSection={hoveredTicketSection}
                onSectionClick={setSelectedMapSection}
              />

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
