import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AttractionsClient from './AttractionsClient';

export const metadata = {
  title: 'Attractions & Experiences — Enttix',
  description: 'Book tickets for world-class attractions, museums, tours and experiences worldwide.',
};

export default function AttractionsPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <AttractionsClient />
      <Footer />
    </main>
  );
}
