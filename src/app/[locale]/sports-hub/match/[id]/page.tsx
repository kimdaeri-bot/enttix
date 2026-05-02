import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MatchPreviewClient from './MatchPreviewClient'

export const metadata = {
  title: 'Match Preview - Sports Hub - Enttix',
  description: 'AI-powered match preview with stats, H2H, and tactical analysis.',
}

export default function MatchPreviewPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <Header hideSearch />
      <MatchPreviewClient />
      <Footer />
    </main>
  )
}
