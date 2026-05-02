import Header from '@/components/Header'
import Footer from '@/components/Footer'
import F1HubClient from './F1HubClient'

export const metadata = {
  title: 'F1 Hub - Sports Hub - Enttix',
  description: 'Formula 1 driver standings, constructor rankings, and race calendar.',
}

export default function F1HubPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <F1HubClient />
      <Footer />
    </main>
  )
}
