'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  order_number: string;       // Tixstock Id
  customer_name: string;
  customer_email: string;
  event_name: string;
  event_date: string;
  venue: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  status: string;
  api_source: string;
  notes: string;
  created_at: string;
}

interface ParsedNotes {
  order_id?: string;
  ticket_details?: string;
  ticket_type?: string;
  order_datetime?: string;
  section?: string;
  enttix_order_id?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  ticketed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const STATUSES = ['pending', 'confirmed', 'paid', 'ticketed', 'cancelled', 'refunded'];

function parseNotes(notes: string): ParsedNotes {
  try { return JSON.parse(notes) || {}; } catch { return {}; }
}

function fmtDate(d: string) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('sv-SE', { timeZone: 'UTC' }).replace('T', ' ').slice(0, 16);
  } catch { return d.slice(0, 16); }
}

function fmtCurrency(amount: number, currency: string) {
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '';
  return `${sym}${Number(amount).toFixed(2)}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const seedOrders = async () => {
    setSeeding(true);
    setSeedResult('');
    try {
      const res = await fetch('/api/admin/seed-orders', { method: 'POST' });
      const data = await res.json();
      const msg = data.results.map((r: { order_number: string; status: string }) => `${r.order_number}: ${r.status}`).join(' | ');
      setSeedResult(msg);
      loadOrders();
    } catch (e) {
      setSeedResult('Error: ' + String(e));
    }
    setSeeding(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const filtered = orders.filter(o =>
    (statusFilter === 'all' || o.status === statusFilter) &&
    (sourceFilter === 'all' || o.api_source === sourceFilter)
  );

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A]">Orders</h1>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2 items-center">
          {seedResult && (
            <span className="text-[11px] text-[#10B981] bg-[#ECFDF5] px-3 py-1.5 rounded-lg font-medium">{seedResult}</span>
          )}
          <button
            onClick={seedOrders}
            disabled={seeding}
            className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {seeding ? 'Syncing...' : '↻ Sync Test Orders'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${statusFilter === s ? 'bg-[#2B7FFF] text-white' : 'bg-[#F1F5F9] text-[#94A3B8] hover:text-[#0F172A]'}`}>
            {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[11px] text-[#94A3B8] font-semibold">Source:</span>
          {['all', 'tixstock', 'manual', 'ltd'].map(s => (
            <button key={s} onClick={() => setSourceFilter(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${sourceFilter === s ? 'bg-[#1E3A8A] text-white' : 'bg-[#F1F5F9] text-[#94A3B8] hover:text-[#0F172A]'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#94A3B8] text-[14px]">No orders yet.</p>
            <button onClick={seedOrders} className="mt-3 text-[#2B7FFF] text-[13px] font-semibold hover:underline">
              ↻ Import test orders from Tixstock
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  {['Tixstock ID', 'Order ID', 'Event', 'Venue', 'Curr', 'Price', 'Details', 'Total', 'Qty', 'Type', 'Order Date', 'Event Date', 'Status'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const n = parseNotes(order.notes);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      onClick={() => setSelected(order)}
                    >
                      {/* Tixstock ID */}
                      <td className="px-3 py-3">
                        <span className="text-[12px] font-bold text-[#2B7FFF] font-mono">{order.order_number}</span>
                      </td>
                      {/* Order ID */}
                      <td className="px-3 py-3">
                        <span className="text-[11px] text-[#374151] font-mono">{n.order_id || n.enttix_order_id || '-'}</span>
                      </td>
                      {/* Event */}
                      <td className="px-3 py-3 max-w-[160px]">
                        <span className="text-[12px] text-[#0F172A] font-semibold line-clamp-2">{order.event_name}</span>
                      </td>
                      {/* Venue */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[11px] text-[#374151]">{order.venue || '-'}</span>
                      </td>
                      {/* Currency */}
                      <td className="px-3 py-3">
                        <span className="text-[11px] font-semibold text-[#374151] bg-[#F1F5F9] px-1.5 py-0.5 rounded">{order.currency}</span>
                      </td>
                      {/* Ticket Price */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[12px] text-[#0F172A] font-semibold">{fmtCurrency(order.unit_price, order.currency)}</span>
                      </td>
                      {/* Ticket Details */}
                      <td className="px-3 py-3 max-w-[130px]">
                        <span className="text-[11px] text-[#374151] line-clamp-2">
                          {n.ticket_details || n.section || '-'}
                        </span>
                      </td>
                      {/* Order Value */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[13px] text-[#10B981] font-bold">{fmtCurrency(order.total_price, order.currency)}</span>
                      </td>
                      {/* Quantity */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-[12px] text-[#0F172A] font-semibold">{order.quantity}</span>
                      </td>
                      {/* Ticket Type */}
                      <td className="px-3 py-3">
                        <span className="text-[10px] font-semibold bg-[#EFF6FF] text-[#2B7FFF] px-2 py-0.5 rounded-full whitespace-nowrap">
                          {n.ticket_type || '-'}
                        </span>
                      </td>
                      {/* Order Datetime */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[11px] text-[#64748B]">{fmtDate(n.order_datetime || order.created_at)}</span>
                      </td>
                      {/* Event Datetime */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[11px] text-[#64748B]">{fmtDate(order.event_date)}</span>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3">
                        <select
                          value={order.status}
                          onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (() => {
        const n = parseNotes(selected.notes);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-[520px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#94A3B8] font-semibold uppercase">Tixstock Order</p>
                  <h2 className="text-[20px] font-bold text-[#0F172A] font-mono">{selected.order_number}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="text-[#94A3B8] hover:text-[#0F172A] text-[20px]">✕</button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  ['Order ID', n.order_id || n.enttix_order_id || '-'],
                  ['Event', selected.event_name],
                  ['Venue', selected.venue],
                  ['Event Date', fmtDate(selected.event_date)],
                  ['Order Date', fmtDate(n.order_datetime || selected.created_at)],
                  ['Section', n.ticket_details || n.section || '-'],
                  ['Ticket Type', n.ticket_type || '-'],
                  ['Currency', selected.currency],
                  ['Unit Price', fmtCurrency(selected.unit_price, selected.currency)],
                  ['Quantity', String(selected.quantity)],
                  ['Total', fmtCurrency(selected.total_price, selected.currency)],
                  ['Customer', selected.customer_name],
                  ['Email', selected.customer_email],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between py-1.5 border-b border-[#F1F5F9] last:border-0">
                    <span className="text-[12px] text-[#94A3B8] font-semibold w-28 flex-shrink-0">{label}</span>
                    <span className="text-[13px] text-[#0F172A] text-right">{value}</span>
                  </div>
                ))}
                {/* Status update */}
                <div>
                  <p className="text-[11px] text-[#94A3B8] uppercase font-semibold mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => updateStatus(selected.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${selected.status === s ? 'bg-[#2B7FFF] text-white' : 'bg-[#F1F5F9] text-[#94A3B8] hover:bg-[#E2E8F0]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
