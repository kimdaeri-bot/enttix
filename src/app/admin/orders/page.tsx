'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_name: string;
  event_date: string;
  venue: string;
  city: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  status: string;
  payment_method: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const STATUSES = ['pending', 'confirmed', 'paid', 'ticketed', 'cancelled', 'refunded'];

const statusColors: Record<string, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  confirmed: 'bg-[#DBEAFE] text-[#1D4ED8]',
  paid: 'bg-[#D1FAE5] text-[#065F46]',
  ticketed: 'bg-[#EDE9FE] text-[#5B21B6]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
  refunded: 'bg-[#F3F4F6] text-[#374151]',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    event_name: '', event_date: '', venue: '', city: '',
    quantity: 1, unit_price: 0, currency: 'GBP', notes: '',
  });

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected({ ...selected, status });

    // Auto-create tickets when status = ticketed
    if (status === 'ticketed') {
      const order = orders.find(o => o.id === id);
      if (order) {
        for (let i = 0; i < order.quantity; i++) {
          await supabase.from('tickets').insert({
            order_id: id,
            ticket_number: '',
            status: 'issued',
            issued_at: new Date().toISOString(),
          });
        }
      }
    }
  };

  const createOrder = async () => {
    const total = form.quantity * form.unit_price;
    const { error } = await supabase.from('orders').insert({
      order_number: '',
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      event_name: form.event_name,
      event_date: form.event_date || null,
      venue: form.venue,
      city: form.city,
      quantity: form.quantity,
      unit_price: form.unit_price,
      total_price: total,
      currency: form.currency,
      status: 'pending',
      notes: form.notes,
    });
    if (error) { alert('Error: ' + error.message); return; }
    setShowCreate(false);
    setForm({ customer_name: '', customer_email: '', customer_phone: '', event_name: '', event_date: '', venue: '', city: '', quantity: 1, unit_price: 0, currency: 'GBP', notes: '' });
    loadOrders();
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    await supabase.from('orders').delete().eq('id', id);
    setOrders(orders.filter(o => o.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-[#0F172A]">Orders</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[13px] font-semibold rounded-lg transition-colors">
          + New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${filter === s ? 'bg-[#2B7FFF] text-white' : 'bg-[#F1F5F9] text-[#94A3B8] hover:text-white'}`}>
            {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12"><p className="text-[#64748B]">No orders</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#E5E7EB]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Order</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Event</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Total</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-b border-[#E5E7EB]/50 hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={() => setSelected(order)}>
                    <td className="px-4 py-3 text-[12px] text-[#2B7FFF] font-mono font-semibold">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-[#0F172A]">{order.customer_name}</p>
                      <p className="text-[10px] text-[#64748B]">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#374151] max-w-[180px] truncate">{order.event_name}</td>
                    <td className="px-4 py-3 text-[12px] text-[#0F172A]">{order.quantity}</td>
                    <td className="px-4 py-3 text-[12px] text-[#0F172A] font-semibold">{order.currency} {Number(order.total_price).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border-0 outline-none cursor-pointer ${statusColors[order.status]}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); deleteOrder(order.id); }} className="text-[#64748B] hover:text-[#EF4444] transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-[500px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-[#0F172A]">{selected.order_number}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[selected.status]}`}>{selected.status}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#94A3B8] hover:text-[#0F172A]">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[11px] text-[#94A3B8] uppercase mb-1">Customer</p>
                <p className="text-[14px] text-[#0F172A] font-semibold">{selected.customer_name}</p>
                <p className="text-[12px] text-[#94A3B8]">{selected.customer_email}</p>
                {selected.customer_phone && <p className="text-[12px] text-[#94A3B8]">{selected.customer_phone}</p>}
              </div>
              <div>
                <p className="text-[11px] text-[#94A3B8] uppercase mb-1">Event</p>
                <p className="text-[14px] text-[#0F172A] font-semibold">{selected.event_name}</p>
                {selected.venue && <p className="text-[12px] text-[#94A3B8]">{selected.venue}{selected.city ? `, ${selected.city}` : ''}</p>}
                {selected.event_date && <p className="text-[12px] text-[#94A3B8]">{new Date(selected.event_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-[11px] text-[#94A3B8]">Qty</p><p className="text-[16px] text-[#0F172A] font-bold">{selected.quantity}</p></div>
                <div><p className="text-[11px] text-[#94A3B8]">Unit Price</p><p className="text-[16px] text-[#0F172A] font-bold">{selected.currency} {Number(selected.unit_price).toLocaleString()}</p></div>
                <div><p className="text-[11px] text-[#94A3B8]">Total</p><p className="text-[16px] text-[#10B981] font-bold">{selected.currency} {Number(selected.total_price).toLocaleString()}</p></div>
              </div>
              {selected.notes && <div><p className="text-[11px] text-[#94A3B8] uppercase mb-1">Notes</p><p className="text-[13px] text-[#374151]">{selected.notes}</p></div>}
              <div className="flex gap-2 pt-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${selected.status === s ? 'bg-[#2B7FFF] text-white' : 'bg-[#F1F5F9] text-[#94A3B8] hover:text-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-[500px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#0F172A]">New Order</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#94A3B8] hover:text-[#0F172A]">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
                { key: 'customer_email', label: 'Email', type: 'email', required: true },
                { key: 'customer_phone', label: 'Phone', type: 'text' },
                { key: 'event_name', label: 'Event Name', type: 'text', required: true },
                { key: 'event_date', label: 'Event Date', type: 'datetime-local' },
                { key: 'venue', label: 'Venue', type: 'text' },
                { key: 'city', label: 'City', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[11px] text-[#94A3B8] uppercase block mb-1">{f.label}{f.required && ' *'}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-[13px] text-white outline-none focus:border-[#1E3A8A] transition-colors"
                    required={f.required}
                  />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#94A3B8] uppercase block mb-1">Qty *</label>
                  <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-[13px] text-white outline-none focus:border-[#1E3A8A]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94A3B8] uppercase block mb-1">Unit Price *</label>
                  <input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-[13px] text-white outline-none focus:border-[#1E3A8A]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94A3B8] uppercase block mb-1">Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-[13px] text-white outline-none focus:border-[#1E3A8A]">
                    <option value="GBP">GBP</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="KRW">KRW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#94A3B8] uppercase block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-[13px] text-white outline-none focus:border-[#1E3A8A] h-20 resize-none" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-[14px] text-[#0F172A] font-bold">Total: {form.currency} {(form.quantity * form.unit_price).toLocaleString()}</p>
                <button onClick={createOrder} className="px-5 py-2.5 bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[13px] font-semibold rounded-lg transition-colors">
                  Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
