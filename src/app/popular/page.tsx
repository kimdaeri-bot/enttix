import { Metadata } from 'next';
import PopularClient from './PopularClient';

export const metadata: Metadata = {
  title: 'Popular | Enttix',
  description: 'Most popular sports, musicals, and entertainment events worldwide.',
};

export default function PopularPage() {
  return <PopularClient />;
}
