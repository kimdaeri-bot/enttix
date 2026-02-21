'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '📋' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/tickets', label: 'Tickets', icon: '🎫' },
  { href: '/admin/images', label: 'Images', icon: '🖼️' },
  { href: '/admin/content', label: 'Content', icon: '📝' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    // Check if user exists in admin_users (RLS: can only see own row)
    supabase.from('admin_users').select('role').eq('id', user.id).single()
      .then(({ data, error }) => {
        if (!error && data) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setChecking(false);
      });
  }, [user, authLoading, router]);

  if (authLoading || checking) return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#1E3A8A] border-t-transparent animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[48px] mb-3">🔒</p>
        <p className="text-[#0F172A] text-[18px] font-bold mb-2">Access Denied</p>
        <p className="text-[#64748B] text-[14px] mb-4">Admin privileges required</p>
        <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-lg text-[13px] font-semibold">Go Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* Sidebar */}
      <aside className="w-[200px] bg-[#1E3A8A] flex flex-col flex-shrink-0 min-h-screen">
        <div className="px-5 py-6">
          <h1 className="text-white font-extrabold text-[18px]">
            Enttix<span className="font-normal text-[#93C5FD]">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-[#93C5FD] hover:bg-white/10 hover:text-white'
                }`}>
                <span className="text-[16px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-6">
          <button onClick={() => { signOut(); router.push('/'); }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium text-[#93C5FD] hover:bg-white/10 hover:text-white transition-colors w-full">
            <span className="text-[16px]">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-[13px] font-bold">
              {(user?.email?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
