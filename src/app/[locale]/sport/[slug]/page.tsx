import CategoryPageClient from './CategoryPageClient';

const sportCategories: Record<string, string> = {
  football: 'Football', tennis: 'Tennis', golf: 'Golf', rugby: 'Rugby',
  cricket: 'Cricket', 'formula-1': 'Formula 1', motogp: 'MotoGP',
  boxing: 'Boxing', ufc: 'UFC', darts: 'Darts', 'ice-hockey': 'Ice Hockey',
  basketball: 'Basketball', baseball: 'Baseball', 'american-football': 'American Football',
  'winter-games': 'Winter Games', athletics: 'Athletics', cycling: 'Cycling',
};

export function generateStaticParams() {
  return Object.keys(sportCategories).map(slug => ({ slug }));
}

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const displayName = sportCategories[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <CategoryPageClient slug={slug} displayName={displayName} categoryType="sport" />;
}
