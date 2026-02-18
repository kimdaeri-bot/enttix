'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get users from orders (unique by email) since we can't query auth.users directly from client
    supabase.from('orders').select('customer_name, customer_email, customer_phone, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const unique = new Map<string, any>();
          data.forEach(o => {
            if (!unique.has(o.customer_email)) {
              unique.set(o.customer_email, { ...o, orderCount: 1 });
            } else {
              unique.get(o.customer_email).orderCount++;
            }
          });
          setUsers(Array.from(unique.values()));
        }
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2 className="text-[24px] font-bold text-[#0F172A] mb-6">Users</h2>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-[#1E3A8A] border-t-transparent animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-[#94A3B8]">No users yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Name', 'Email', 'Phone', 'Orders', 'First Seen'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-[11px] font-bold">
                        {(u.customer_name?.[0] || '?').toUpperCase()}
                      </div>
                      <span className="text-[13px] text-[#0F172A] font-medium">{u.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#374151]">{u.customer_email}</td>
                  <td className="px-6 py-4 text-[13px] text-[#374151]">{u.customer_phone || '-'}</td>
                  <td className="px-6 py-4 text-[13px] text-[#0F172A] font-semibold">{u.orderCount}</td>
                  <td className="px-6 py-4 text-[12px] text-[#94A3B8]">
                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
