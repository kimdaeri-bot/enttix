import EventClient from './EventClient';

export function generateStaticParams() {
  return [
    { id: 'demo-1' }, { id: 'demo-2' }, { id: 'demo-3' }, { id: 'demo-4' },
    { id: 'demo-5' }, { id: 'demo-6' }, { id: 'demo-7' }, { id: 'demo-8' },
  ];
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventClient id={id} />;
}
