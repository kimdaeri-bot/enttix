import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeagueClient from './LeagueClient'

export const metadata = {
  title: 'League Standings - Sports Hub - Enttix',
  description: 'Full standings, upcoming fixtures, and top scorers.',
}

export default function LeaguePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <LeagueClient />
      <Footer />
    </main>
  )
}
