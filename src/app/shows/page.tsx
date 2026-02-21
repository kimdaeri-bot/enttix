import { Metadata } from 'next';
import ShowsClient from './ShowsClient';

export const metadata: Metadata = {
  title: 'Shows | Enttix',
  description: 'West End musicals, Broadway, opera, ballet and theatre shows.',
};

export default function ShowsPage() {
  return <ShowsClient />;
}
