import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PopularClient from './PopularClient';

export const metadata = {
  title: 'Popular — Enttix',
  description: 'Most popular sports, musicals, and entertainment events worldwide.',
};

export default function PopularPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <PopularClient />
      <Footer />
    </main>
  );
}
