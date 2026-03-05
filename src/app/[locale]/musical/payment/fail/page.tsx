'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useTranslations } from 'next-intl';

function FailContent() {
  const t = useTranslations('payment');
  const params = useSearchParams();
  const reason = params.get('reason') || 'Payment was cancelled or an error occurred.';
  return (
    <div className="max-w-[480px] mx-auto px-6 py-20 text-center">
      <div className="text-6xl mb-4">😔</div>
      <h1 className="text-[28px] font-extrabold text-[#0F172A] mb-3">{t('fail')}</h1>
      <p className="text-[#64748B] text-[15px] mb-8">{reason}</p>
      <Link href="/musical/west-end" className="inline-block px-8 py-4 bg-[#2B7FFF] text-white rounded-xl font-bold hover:bg-[#1D6AE5]">
        Try Again
      </Link>
    </div>
  );
}

export default function PaymentFailPage() {
  const t = useTranslations('payment');
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0F172A]"><Header hideSearch /></div>
      <Suspense fallback={<div className="py-20 text-center text-[#64748B]">{t('loading')}</div>}>
        <FailContent />
      </Suspense>
    </main>
  );
}
