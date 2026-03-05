import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EntertainmentClient from './EntertainmentClient';

export const metadata = {
  title: 'Entertainment — Enttix',
  description: 'UK Arts & Theatre, Music, Sports events powered by Ticketmaster',
};

export default function EntertainmentPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <EntertainmentClient />
      <Footer />
    </main>
  );
}
