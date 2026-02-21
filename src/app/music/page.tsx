import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MusicClient from './MusicClient';

export const metadata = {
  title: 'Music — Enttix',
  description: 'Live music concerts — Pop, Rock, Hip-Hop, Jazz, Electronic and more.',
};

export default function MusicPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <MusicClient />
      <Footer />
    </main>
  );
}
