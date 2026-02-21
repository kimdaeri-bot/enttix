import { Metadata } from 'next';
import MusicClient from './MusicClient';

export const metadata: Metadata = {
  title: 'Music | Enttix',
  description: 'Live music concerts — Pop, Rock, Hip-Hop, Jazz, Electronic and more.',
};

export default function MusicPage() {
  return <MusicClient />;
}
