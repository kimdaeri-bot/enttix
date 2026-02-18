import MusicalListClient from './MusicalListClient';

const musicalCategories: Record<string, string> = {
  'west-end': 'West End', 'broadway': 'Broadway', 'opera': 'Opera',
  'ballet': 'Ballet', 'comedy': 'Comedy', 'drama': 'Drama',
  'family-shows': 'Family Shows', 'dance': 'Dance',
  'circus': 'Circus', 'magic-shows': 'Magic Shows',
};

export function generateStaticParams() {
  return Object.keys(musicalCategories).map(slug => ({ slug }));
}

export default async function MusicalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const displayName = musicalCategories[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <MusicalListClient slug={slug} displayName={displayName} />;
}
