'use client';
import Header from '@/components/Header';
import SeatMap from '@/components/SeatMap';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Match } from '@/types';
import { useCart } from '@/context/CartContext';

interface TicketListing {
  id: string;
  section: string;
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
}

const demoTickets: TicketListing[] = [
  { id: 't1', section: 'North Stand', row: '12', seat: '1-4', type: 'eTicket', price: 151.45, maxQty: 4, quantityOptions: [1,2,3,4], benefits: [], isEticket: true, isAisle: false, isVip: false },
  { id: 't2', section: 'East Stand', row: '8', seat: '15-16', type: 'eTicket', price: 195.00, maxQty: 2, quantityOptions: [2], benefits: ['Includes unlimited food and drinks'], isEticket: true, isAisle: true, isVip: true, splitWarning: 'Cannot purchase leaving only 1 ticket' },
  { id: 't3', section: 'South Stand', row: 'Standing', seat: 'GA', type: 'eTicket', price: 85.00, maxQty: 8, quantityOptions: [1,2,3,4,5,6,7,8], benefits: [], isEticket: true, isAisle: false, isVip: false },
  { id: 't4', section: 'West Stand', row: '3', seat: '22-23', type: 'Paper', price: 220.00, maxQty: 2, quantityOptions: [1,2], benefits: ['VIP entrance access'], isEticket: false, isAisle: false, isVip: true },
  { id: 't5', section: 'NW Corner', row: '6', seat: '1-6', type: 'eTicket', price: 110.00, maxQty: 6, quantityOptions: [1,2,3,4,5,6], benefits: [], isEticket: true, isAisle: true, isVip: false },
];

function getSplitQuantities(available: number, splitType: string, displayQty?: number): number[] {
  if (displayQty && displayQty > 0) return [displayQty];
  switch (splitType) {
    case 'any': return Array.from({ length: available }, (_, i) => i + 1);
    case 'avoid-one': return Array.from({ length: available }, (_, i) => i + 1).filter(n => n !== available - 1);
    case 'none': return [available];
    case 'pairs': return Array.from({ length: Math.floor(available / 2) }, (_, i) => (i + 1) * 2);
    default: return Array.from({ length: available }, (_, i) => i + 1);
  }
}

export default function EventClient({ id }: { id: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [tickets, setTickets] = useState<TicketListing[]>(demoTickets);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [minQtyFilter, setMinQtyFilter] = useState(1);
  const [sectionFilter, setSectionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedMapSection, setSelectedMapSection] = useState<string | null>(null);
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const cart = useCart();
  const router = useRouter();

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
          }
        }

        const tickRes = await fetch(`/api/tixstock/tickets?event_id=${id}`);
        if (tickRes.ok) {
          const tickData = await tickRes.json();
          const listings = tickData.data || [];
          if (listings.length > 0) {
            setTickets(listings.map((l: Record<string, unknown>) => {
              const seat = l.seat_details as Record<string, string> || {};
              const pricing = l.pricing as Record<string, number> || {};
              const qty = l.quantity as Record<string, number> || {};
              const ticket = l.ticket as Record<string, string> || {};
              const rb = (l.restrictions_benefits as string[]) || [];
              const available = qty.available || 1;
              const splitType = ticket.split_type || 'any';
              const displayQty = qty.display_quantity || 0;
              return {
                id: String(l.id),
                section: seat.section || seat.category || 'General',
                row: seat.row || 'GA',
                seat: seat.seat || '',
                type: ticket.type || 'eTicket',
                price: pricing.proceed_price || 0,
                maxQty: available,
                quantityOptions: getSplitQuantities(available, splitType, displayQty),
                benefits: rb,
                isEticket: (ticket.type || '').toLowerCase().includes('eticket') || (ticket.etickets as unknown as string[])?.length > 0,
                isAisle: false,
                isVip: rb.some(r => r.toLowerCase().includes('vip')),
                splitWarning: splitType === 'avoid-one' ? 'Cannot purchase leaving only 1 ticket' : undefined,
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

  const addToCart = async (ticket: TicketListing) => {
    const qty = quantities[ticket.id] || ticket.quantityOptions[0] || 1;
    setHoldingId(ticket.id);
    try {
      const res = await fetch('/api/tixstock/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: ticket.id, quantity: qty }),
      });
      let holdId: string | undefined;
      if (res.ok) {
        const data = await res.json();
        holdId = data.meta?.hold_id;
      }
      cart.addItem({
        listingId: ticket.id, eventId: id, eventName: match?.name || '',
        section: ticket.section, row: ticket.row, quantity: qty,
        pricePerTicket: ticket.price, currency: match?.currency || 'USD',
        ticketType: ticket.type, holdId,
      });
    } catch {
      // Still add to cart even if hold fails
      cart.addItem({
        listingId: ticket.id, eventId: id, eventName: match?.name || '',
        section: ticket.section, row: ticket.row, quantity: qty,
        pricePerTicket: ticket.price, currency: match?.currency || 'USD',
        ticketType: ticket.type,
      });
    } finally {
      setHoldingId(null);
    }
  };

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
      const isGA = ticket.row === 'GA' || ticket.seat === 'GA' || ticket.seat === '';
      router.push(
        `/sport/checkout?holdId=${holdId}&listingId=${ticket.id}&quantity=${qty}&price=${ticket.price}` +
        `&section=${encodeURIComponent(ticket.section)}&row=${encodeURIComponent(ticket.row)}` +
        `&seat=${encodeURIComponent(ticket.seat)}&eventId=${id}` +
        `&eventName=${encodeURIComponent(match?.name || '')}&general_admission=${isGA}`
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
  const mapSectionLower = selectedMapSection?.replace(/-/g, ' ') || '';
  const filteredTickets = tickets.filter(t => {
    if (t.maxQty < minQtyFilter) return false;
    if (sectionFilter && t.section !== sectionFilter) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    if (mapSectionLower && !t.section.toLowerCase().includes(mapSectionLower.split(' ')[0])) return false;
    return true;
  });

  const seatMapSections = sections.map(s => {
    const min = Math.min(...tickets.filter(t => t.section === s).map(t => t.price));
    return { name: s, minPrice: min };
  });

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
                <div key={ticket.id} className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 hover:shadow-md hover:border-[#2B7FFF]/20 transition-all">
                  <div className="flex items-start gap-4">
                    {/* Left: Icon + Section */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[8px] bg-[#EFF6FF] flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2">
                          <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 010 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 010-4V7a2 2 0 00-2-2H5z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-[#171717]">{ticket.section}</p>
                        <p className="text-[12px] text-[#6B7280]">Row {ticket.row}{ticket.seat ? ` • Seat ${ticket.seat}` : ''}</p>
                      </div>
                    </div>

                    {/* Center: Badges + Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[12px] text-[#6B7280]">Up to {ticket.maxQty}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ticket.isEticket && (
                          <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[10px] font-semibold text-[#2B7FFF]">eTicket</span>
                        )}
                        {ticket.isAisle && (
                          <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[10px] font-semibold text-[#16A34A]">Aisle</span>
                        )}
                        {ticket.isVip && (
                          <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[10px] font-semibold text-[#D97706]">VIP</span>
                        )}
                      </div>
                      {ticket.benefits.length > 0 && (
                        <p className="text-[11px] text-[#16A34A] mt-1.5">✨ {ticket.benefits[0]}</p>
                      )}
                      {ticket.splitWarning && (
                        <p className="text-[11px] text-[#EF4444] mt-1">⚠️ {ticket.splitWarning}</p>
                      )}
                    </div>

                    {/* Right: Price + Qty + Add */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[18px] font-bold text-[#171717]">${ticket.price.toFixed(2)}</p>
                        <p className="text-[11px] text-[#9CA3AF]">per ticket</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const cur = quantities[ticket.id] || ticket.quantityOptions[0] || 1;
                            const idx = ticket.quantityOptions.indexOf(cur);
                            if (idx > 0) setQuantities({ ...quantities, [ticket.id]: ticket.quantityOptions[idx - 1] });
                          }}
                          className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[14px] font-bold text-[#6B7280] hover:bg-[#F1F5F9] transition-colors"
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
                          className="w-8 h-8 rounded-[6px] border border-[#E5E7EB] flex items-center justify-center text-[14px] font-bold text-[#6B7280] hover:bg-[#F1F5F9] transition-colors"
                        >+</button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            const qty = quantities[ticket.id] || ticket.quantityOptions[0] || 1;
                            handleBuyNow(ticket, qty);
                          }}
                          disabled={buyingId === ticket.id}
                          className="px-5 py-2.5 rounded-[8px] bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[13px] font-semibold transition-colors active:scale-95 disabled:opacity-50 whitespace-nowrap"
                        >
                          {buyingId === ticket.id ? '...' : 'Buy Now'}
                        </button>
                        <button
                          onClick={() => addToCart(ticket)}
                          disabled={holdingId === ticket.id}
                          className="px-5 py-2 rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F1F5F9] text-[#374151] text-[12px] font-medium transition-colors active:scale-95 disabled:opacity-50"
                        >
                          {holdingId === ticket.id ? '...' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
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
          <div className="w-full lg:w-[40%] flex-shrink-0">
            <div className="sticky top-4">
              <SeatMap
                venueName={match.venue.name}
                sections={seatMapSections}
                selectedSection={selectedMapSection}
                onSectionClick={setSelectedMapSection}
              />

              {/* Quick cart summary */}
              {cart.totalItems > 0 && (
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#2B7FFF] text-white text-[12px] font-bold flex items-center justify-center">{cart.totalItems}</span>
                      <h3 className="text-[15px] font-bold text-[#171717]">Cart</h3>
                    </div>
                    <span className="text-[18px] font-bold text-[#171717]">${cart.totalPrice.toFixed(2)}</span>
                  </div>
                  {cart.items.slice(0, 3).map(item => (
                    <div key={item.listingId} className="flex items-center justify-between py-1.5 text-[12px] text-[#6B7280]">
                      <span>{item.section} • Row {item.row} × {item.quantity}</span>
                      <span className="font-semibold text-[#171717]">${(item.pricePerTicket * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <Link href="/cart" className="block w-full text-center bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-3 transition-colors">
                    View Cart & Checkout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
