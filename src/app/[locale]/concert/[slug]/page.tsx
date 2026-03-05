import CategoryPageClient from './CategoryPageClient';

const concertCategories: Record<string, string> = {
  pop: 'Pop', rock: 'Rock', 'rap-hip-hop': 'Rap/Hip-hop', 'r-b': 'R&B',
  country: 'Country', latin: 'Latin', alternative: 'Alternative',
  electronic: 'Electronic', soul: 'Soul', classical: 'Classical',
  jazz: 'Jazz', metal: 'Metal',
};

export function generateStaticParams() {
  return Object.keys(concertCategories).map(slug => ({ slug }));
}

export default async function ConcertPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const displayName = concertCategories[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <CategoryPageClient slug={slug} displayName={displayName} categoryType="concert" />;
}
