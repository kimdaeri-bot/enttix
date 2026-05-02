import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SportsHubClient from './SportsHubClient'

export const metadata = {
  title: 'Sports Hub - Enttix',
  description: 'Live sports data, match previews, and tickets for top football leagues and F1.',
}

export default function SportsHubPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <SportsHubClient />
      <Footer />
    </main>
  )
}
