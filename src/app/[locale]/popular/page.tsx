import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PopularClient from './PopularClient';

export const metadata = {
  title: 'Popular — Enttix',
  description: 'Most popular sports, musicals, and entertainment events worldwide.',
};

export default function PopularPage() {
  return (
    <main className="min-h-screen" style={{ background: '#0A0F1E' }}>
      <Header hideSearch />
      <Suspense fallback={<div className="min-h-screen" style={{ background: '#0A0F1E' }} />}>
        <PopularClient />
      </Suspense>
      <Footer />
    </main>
  );
}
