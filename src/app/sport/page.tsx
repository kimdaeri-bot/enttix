import { Metadata } from 'next';
import SportsClient from './SportsClient';

export const metadata: Metadata = {
  title: 'Sports | Enttix',
  description: 'Live sports events worldwide — Football, Basketball, Baseball, Hockey and more.',
};

export default function SportsPage() {
  return <SportsClient />;
}
