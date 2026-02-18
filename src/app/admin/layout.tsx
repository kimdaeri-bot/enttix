'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    supabase.from('admin_users').select('role').eq('id', user.id).single()
      .then(({ data, error }) => {
        if (error || !data) {
          // If no admin_users exist yet, allow first user as admin
          supabase.from('admin_users').select('id').limit(1).then(({ data: admins }) => {
            if (!admins || admins.length === 0) {
              // Auto-register first user as admin
              supabase.from('admin_users').insert({ id: user.id, role: 'admin' }).then(() => {
                setIsAdmin(true);
                setChecking(false);
              });
            } else {
              setIsAdmin(false);
              setChecking(false);
            }
          });
        } else {
          setIsAdmin(true);
          setChecking(false);
        }
      });
  }, [user, authLoading, router]);

  if (authLoading || checking) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#2B7FFF] border-t-transparent animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[48px] mb-3">🔒</p>
        <p className="text-white text-[18px] font-bold mb-2">Access Denied</p>
        <p className="text-[#94A3B8] text-[14px] mb-4">Admin privileges required</p>
        <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-[#2B7FFF] text-white rounded-lg text-[13px] font-semibold">Go Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#1E293B] border-r border-[#334155] flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-[#334155]">
          <Link href="/admin" className="text-white font-extrabold text-[20px] italic">enttix</Link>
          <p className="text-[11px] text-[#64748B] mt-0.5">Back Office</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-[#CBD5E1] hover:bg-[#334155] hover:text-white transition-colors">
            📊 Dashboard
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-[#CBD5E1] hover:bg-[#334155] hover:text-white transition-colors">
            📋 Orders
          </Link>
          <Link href="/admin/tickets" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-[#CBD5E1] hover:bg-[#334155] hover:text-white transition-colors">
            🎫 Tickets
          </Link>
        </nav>
        <div className="p-3 border-t border-[#334155]">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-7 h-7 rounded-full bg-[#2B7FFF] flex items-center justify-center text-white text-[10px] font-bold">
              {(user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#CBD5E1] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => { signOut(); router.push('/'); }} className="w-full px-4 py-2 text-left text-[12px] text-[#94A3B8] hover:text-[#EF4444] transition-colors">
            Sign Out
          </button>
          <Link href="/" className="block px-4 py-2 text-[12px] text-[#94A3B8] hover:text-white transition-colors">
            ← Back to Site
          </Link>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
