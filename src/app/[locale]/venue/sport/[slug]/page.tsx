import SportVenueClient from './SportVenueClient';

export function generateStaticParams() {
  return [{ slug: 'demo' }];
}

export default async function SportVenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SportVenueClient slug={slug} />;
}
