import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SportsClient from './SportsClient';

export const metadata = {
  title: 'Sports — Enttix',
  description: 'Live sports events worldwide — Football, Basketball, Baseball, Hockey and more.',
};

export default function SportsPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <SportsClient />
      <Footer />
    </main>
  );
}
