import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ShowsClient from './ShowsClient';

export const metadata = {
  title: 'Shows — Enttix',
  description: 'West End musicals, Broadway, opera, ballet and theatre shows.',
};

export default function ShowsPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <ShowsClient />
      <Footer />
    </main>
  );
}
