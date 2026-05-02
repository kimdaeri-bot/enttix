import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TeamClient from './TeamClient'

export const metadata = {
  title: 'Team Profile - Sports Hub - Enttix',
  description: 'Team info, squad, fixtures, and injury reports.',
}

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <TeamClient />
      <Footer />
    </main>
  )
}
