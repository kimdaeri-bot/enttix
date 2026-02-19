import TheatreVenueClient from './TheatreVenueClient';

export function generateStaticParams() {
  return [{ slug: 'demo' }];
}

export default async function TheatreVenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TheatreVenueClient slug={slug} />;
}
