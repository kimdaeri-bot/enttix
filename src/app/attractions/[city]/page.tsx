'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { getAttractionsByCity, type AttractionItem } from '@/lib/attractions-db';

/* ─── CITY MAP ──────────────────────────────────────────────── */
const CITY_MAP: Record<string, {
  id: number;
  name: string;
  tiqetsSlug: string;
  photo: string;
  desc: string;
}> = {
  london:        { id: 67458,  name: 'London',       tiqetsSlug: 'london-attractions-c67458',       photo: 'photo-1513635269975-59663e0ac1ad', desc: 'Explore the Tower of London, royal palaces, world-class museums and iconic landmarks.' },
  paris:         { id: 66746,  name: 'Paris',        tiqetsSlug: 'paris-attractions-c66746',        photo: 'photo-1502602898657-3e91760cbb34', desc: 'Climb the Eiffel Tower, visit the Louvre and stroll along the Champs-Élysées.' },
  barcelona:     { id: 66342,  name: 'Barcelona',    tiqetsSlug: 'barcelona-attractions-c66342',    photo: 'photo-1583422409516-2895a77efded', desc: "Discover Gaudí's masterpieces, beautiful beaches and vibrant Catalan culture." },
  rome:          { id: 71631,  name: 'Rome',         tiqetsSlug: 'rome-attractions-c71631',         photo: 'photo-1552832230-c0197dd311b5',    desc: 'Walk through 2,500 years of history in the Colosseum, Vatican and beyond.' },
  amsterdam:     { id: 75061,  name: 'Amsterdam',    tiqetsSlug: 'amsterdam-attractions-c75061',    photo: 'photo-1534351590666-13e3e96b5017', desc: 'Cruise the canals, visit the Rijksmuseum and discover world-famous art.' },
  dubai:         { id: 60005,  name: 'Dubai',        tiqetsSlug: 'dubai-attractions-c60005',        photo: 'photo-1512453979798-5ea266f8880c', desc: 'Soar to the top of the Burj Khalifa, explore desert dunes and luxury experiences.' },
  singapore:     { id: 78125,  name: 'Singapore',    tiqetsSlug: 'singapore-attractions-c78125',    photo: 'photo-1525625293386-3f8f99389edd', desc: 'From Gardens by the Bay to Sentosa Island — a city full of surprises.' },
  prague:        { id: 64162,  name: 'Prague',       tiqetsSlug: 'prague-attractions-c64162',       photo: 'photo-1541849546-216549ae216d',    desc: 'Wander the cobblestone streets, cross Charles Bridge and visit Prague Castle.' },
  madrid:        { id: 66254,  name: 'Madrid',       tiqetsSlug: 'madrid-attractions-c66254',       photo: 'photo-1539037116277-4db20889f2d4', desc: 'World-class art, tapas culture and the grandeur of the Prado Museum.' },
  vienna:        { id: 60335,  name: 'Vienna',       tiqetsSlug: 'vienna-attractions-c60335',       photo: 'photo-1516550893923-42d28e5677af', desc: 'Imperial palaces, classical music and the finest coffee house culture in Europe.' },
  'new-york':    { id: 260932, name: 'New York',     tiqetsSlug: 'new-york-attractions-c260932',    photo: 'photo-1496442226666-8d4d0e62e6e9', desc: 'From the Statue of Liberty to Broadway — the city that never sleeps.' },
  tokyo:         { id: 72181,  name: 'Tokyo',        tiqetsSlug: 'tokyo-attractions-c72181',        photo: 'photo-1540959733332-eab4deabeeaf', desc: 'Ancient temples, futuristic technology and endless culinary adventures.' },
  istanbul:      { id: 79079,  name: 'Istanbul',     tiqetsSlug: 'istanbul-attractions-c79079',     photo: 'photo-1524231757912-21f4fe3a7200', desc: 'Where East meets West — mosques, bazaars, Bosphorus cruises and Byzantine history.' },
  florence:      { id: 71854,  name: 'Florence',     tiqetsSlug: 'florence-attractions-c71854',     photo: 'photo-1541370976299-4d24be63e9d7', desc: 'The cradle of the Renaissance — Uffizi Gallery, Duomo and Michelangelo\'s David.' },
  lisbon:        { id: 76528,  name: 'Lisbon',       tiqetsSlug: 'lisbon-attractions-c76528',       photo: 'photo-1585208798174-6cedd4234ae0', desc: 'Pastel-coloured hills, trams, Fado music and the world\'s best custard tarts.' },
  venice:        { id: 71510,  name: 'Venice',       tiqetsSlug: 'venice-attractions-c71510',       photo: 'photo-1523906834658-6e24ef2386f9', desc: 'Glide through canals, explore the Doge\'s Palace and lose yourself in ancient alleyways.' },
  berlin:        { id: 65144,  name: 'Berlin',       tiqetsSlug: 'berlin-attractions-c65144',       photo: 'photo-1560969184-10fe8719e047', desc: 'History, art and nightlife collide — from the Brandenburg Gate to Museum Island.' },
  milan:         { id: 71749,  name: 'Milan',        tiqetsSlug: 'milan-attractions-c71749',        photo: 'photo-1520175480921-4edfa2983e0f', desc: 'Fashion, design and da Vinci\'s Last Supper in the style capital of the world.' },
  krakow:        { id: 46,     name: 'Krakow',       tiqetsSlug: 'krakow-attractions-c46',          photo: 'photo-1519197924294-4ba991a11128', desc: 'Medieval charm, Wawel Castle and a powerful history in Poland\'s cultural heart.' },
  sydney:        { id: 60400,  name: 'Sydney',       tiqetsSlug: 'sydney-attractions-c60400',       photo: 'photo-1506973035872-a4ec16b8e8d9', desc: 'Iconic Opera House, Harbour Bridge, stunning beaches and a vibrant food scene.' },
  athens:        { id: 99239,  name: 'Athens',       tiqetsSlug: 'athens-attractions-c99239',       photo: 'photo-1555993539-1732b0258235', desc: 'Walk in the footsteps of ancient philosophers — the Acropolis, Parthenon and beyond.' },
  bangkok:       { id: 78586,  name: 'Bangkok',      tiqetsSlug: 'bangkok-attractions-c78586',      photo: 'photo-1508009603885-50cf7c579365', desc: 'Glittering temples, floating markets, street food and electrifying nightlife.' },
  edinburgh:     { id: 21,     name: 'Edinburgh',    tiqetsSlug: 'edinburgh-attractions-c21',       photo: 'photo-1583195763991-f8a6b52de74d', desc: 'A dramatic castle on volcanic rock, whisky trails and the world\'s biggest arts festival.' },
  dublin:        { id: 68616,  name: 'Dublin',       tiqetsSlug: 'dublin-attractions-c68616',       photo: 'photo-1549918864-48ac28d3be1b', desc: 'Guinness, Georgian streets, Viking history and the warmest pubs in Europe.' },
  'mexico-city': { id: 74040,  name: 'Mexico City',  tiqetsSlug: 'mexico-city-attractions-c74040',  photo: 'photo-1518105779142-d975f22f1b0a', desc: 'Ancient pyramids, Frida Kahlo, street tacos and one of the world\'s great capital cities.' },
  munich:        { id: 31,     name: 'Munich',       tiqetsSlug: 'munich-attractions-c31',          photo: 'photo-1595867818082-083862f3d630', desc: 'Oktoberfest, fairytale castles, BMW museums and Alpine day trips.' },
  budapest:      { id: 68199,  name: 'Budapest',     tiqetsSlug: 'budapest-attractions-c68199',     photo: 'photo-1541264643588-4927a7e47e2a', desc: 'Thermal baths, stunning Parliament building and Danube river cruises.' },
  brussels:      { id: 60843,  name: 'Brussels',     tiqetsSlug: 'brussels-attractions-c60843',     photo: 'photo-1491557345352-5929e343eb89', desc: 'Art Nouveau architecture, world-famous chocolate, waffles and the EU quarter.' },
  'cape-town':   { id: 82923,  name: 'Cape Town',    tiqetsSlug: 'cape-town-attractions-c82923',    photo: 'photo-1580060839134-75a5edca2e99', desc: 'Table Mountain, penguin colonies, wine routes and the Cape of Good Hope.' },
  cairo:         { id: 65792,  name: 'Cairo',        tiqetsSlug: 'cairo-attractions-c65792',        photo: 'photo-1539650116574-75c0c6d73f6e', desc: 'The Great Pyramids, Sphinx, Egyptian Museum and the timeless River Nile.' },
  bali:          { id: 267738, name: 'Bali',         tiqetsSlug: 'bali-attractions-c267738',        photo: 'photo-1537996194471-e657df975ab4', desc: 'Rice terraces, sacred temples, surf beaches and a unique Hindu culture.' },
  bruges:        { id: 60844,  name: 'Bruges',       tiqetsSlug: 'bruges-attractions-c60844',       photo: 'photo-1491557345352-5929e343eb89', desc: 'The Venice of the North — canals, medieval architecture and world-class beer.' },
  osaka:         { id: 28,     name: 'Osaka',        tiqetsSlug: 'osaka-attractions-c28',           photo: 'photo-1589308078059-be1415eab4c3', desc: 'Street food paradise, neon-lit Dotonbori, Universal Studios and vibrant nightlife.' },
  kyoto:         { id: 72420,  name: 'Kyoto',        tiqetsSlug: 'kyoto-attractions-c72420',        photo: 'photo-1528360983277-13d401cdc186', desc: 'Ancient temples, geisha districts, bamboo groves and the essence of traditional Japan.' },
  seoul:         { id: 73067,  name: 'Seoul',        tiqetsSlug: 'seoul-attractions-c73067',        photo: 'photo-1538485399081-7191377e8241', desc: 'K-pop culture, royal palaces, cutting-edge tech and incredible Korean cuisine.' },
};

/* ─── CATEGORIES (도시별 top-6 tag_id 기반) ────────────────── */
const CITY_CATEGORIES: Record<string, { id: string; label: string; icon: string }[]> = {
  'london':       [{ id:'2596',label:'Shows',icon:'🎭'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'}],
  'paris':        [{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'703',label:'Science',icon:'🔬'}],
  'barcelona':    [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1048',label:'Public Transport',icon:'🚇'},{ id:'1032',label:'City Cards',icon:'🎫'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'710',label:'Places of Worship',icon:'⛪'}],
  'rome':         [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'710',label:'Places of Worship',icon:'⛪'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1840',label:'Transfers',icon:'🚖'}],
  'amsterdam':    [{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'}],
  'dubai':        [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'singapore':    [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'723',label:'Zoos',icon:'🦁'},{ id:'725',label:'Botanical Gardens',icon:'🌿'}],
  'prague':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'705',label:'Castles',icon:'🏰'},{ id:'1035',label:'Cruises',icon:'🚢'}],
  'madrid':       [{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'706',label:'Palaces',icon:'👑'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'vienna':       [{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'706',label:'Palaces',icon:'👑'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1032',label:'City Cards',icon:'🎫'},{ id:'708',label:'Historical Sites',icon:'🏛️'}],
  'new-york':     [{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1032',label:'City Cards',icon:'🎫'}],
  'tokyo':        [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'istanbul':     [{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'710',label:'Places of Worship',icon:'⛪'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1033',label:'Workshops',icon:'🎓'},{ id:'706',label:'Palaces',icon:'👑'}],
  'florence':     [{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'710',label:'Places of Worship',icon:'⛪'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'lisbon':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'706',label:'Palaces',icon:'👑'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'708',label:'Historical Sites',icon:'🏛️'}],
  'venice':       [{ id:'1840',label:'Transfers',icon:'🚖'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'706',label:'Palaces',icon:'👑'},{ id:'1033',label:'Workshops',icon:'🎓'}],
  'berlin':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'milan':        [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'710',label:'Places of Worship',icon:'⛪'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1840',label:'Transfers',icon:'🚖'},{ id:'1040',label:'City Tours',icon:'🗺️'}],
  'krakow':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1035',label:'Cruises',icon:'🚢'}],
  'sydney':       [{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'723',label:'Zoos',icon:'🦁'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'700',label:'Art Museums',icon:'🎨'}],
  'athens':       [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'1049',label:'Rentals',icon:'🚲'}],
  'bangkok':      [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'706',label:'Palaces',icon:'👑'},{ id:'1033',label:'Workshops',icon:'🎓'}],
  'edinburgh':    [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'705',label:'Castles',icon:'🏰'},{ id:'1942',label:'Undergrounds',icon:'🕳️'}],
  'dublin':       [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'mexico-city':  [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'munich':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'705',label:'Castles',icon:'🏰'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'706',label:'Palaces',icon:'👑'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'700',label:'Art Museums',icon:'🎨'}],
  'budapest':     [{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'710',label:'Places of Worship',icon:'⛪'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'brussels':     [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'703',label:'Science',icon:'🔬'},{ id:'1032',label:'City Cards',icon:'🎫'}],
  'cape-town':    [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1035',label:'Cruises',icon:'🚢'}],
  'cairo':        [{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1840',label:'Transfers',icon:'🚖'}],
  'bali':         [{ id:'710',label:'Places of Worship',icon:'⛪'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'723',label:'Zoos',icon:'🦁'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'bruges':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'708',label:'Historical Sites',icon:'🏛️'}],
  'osaka':        [{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1032',label:'City Cards',icon:'🎫'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'702',label:'History Museums',icon:'📜'}],
  'kyoto':        [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'1033',label:'Workshops',icon:'🎓'}],
  'seoul':        [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'706',label:'Palaces',icon:'👑'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'702',label:'History Museums',icon:'📜'}],
};

const ALL_CATEGORIES = [
  { id: '700',  label: 'Art Museums',               icon: '🎨' },
  { id: '709',  label: 'Archaeological Sites',       icon: '⛏️' },
  { id: '725',  label: 'Botanical Gardens',          icon: '🌿' },
  { id: '705',  label: 'Castles',                    icon: '🏰' },
  { id: '1032', label: 'City Cards & Passes',        icon: '🎫' },
  { id: '1040', label: 'City Tours',                 icon: '🗺️' },
  { id: '1035', label: 'Cruises & Boat Tours',       icon: '🚢' },
  { id: '1042', label: 'Day Trips',                  icon: '🚌' },
  { id: '1034', label: 'Food & Drinks',              icon: '🍽️' },
  { id: '708',  label: 'Historical Sites',           icon: '🏛️' },
  { id: '702',  label: 'History Museums',            icon: '📜' },
  { id: '701',  label: 'Interactive Museums',        icon: '🎭' },
  { id: '706',  label: 'Palaces',                    icon: '👑' },
  { id: '710',  label: 'Places of Worship',          icon: '⛪' },
  { id: '1048', label: 'Public Transport',           icon: '🚇' },
  { id: '1049', label: 'Rentals',                    icon: '🚲' },
  { id: '703',  label: 'Science & Technology',       icon: '🔬' },
  { id: '2596', label: 'Shows & Theatres',           icon: '🎭' },
  { id: '712',  label: 'Theme Parks',                icon: '🎡' },
  { id: '1840', label: 'Transfers',                  icon: '🚖' },
  { id: '2597', label: 'Travel Services',            icon: '✈️' },
  { id: '1942', label: 'Undergrounds',               icon: '🕳️' },
  { id: '1033', label: 'Workshops & Classes',        icon: '🎓' },
  { id: '723',  label: 'Zoos & Safari Parks',        icon: '🦁' },
];

const AUDIENCE_CHIPS = [
  { icon: '👫', label: 'Couples' },
  { icon: '👨‍👩‍👧', label: 'Families' },
  { icon: '🧍', label: 'Solo' },
  { icon: '👥', label: 'Friends' },
  { icon: '🎒', label: 'Backpackers' },
];

/* ─── TYPES ─────────────────────────────────────────────────── */
interface TiqetsProduct {
  id: number;
  title: string;
  tagline?: string;
  summary?: string;
  images?: string[];
  price?: number;
  ratings?: { total: number; average: number };
  promo_label?: string;
  instant_ticket_delivery?: boolean;
  cancellation?: string;
  duration?: string;
  skip_line?: boolean;
  smartphone_ticket?: boolean;
  city_name?: string;
  product_checkout_url?: string;
  product_url?: string;
  tag_ids?: number[];
  venue?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'rating';

/* ─── SKELETON ───────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse mt-2" />
      </div>
    </div>
  );
}

/* ─── TOP10 CARD ─────────────────────────────────────────────── */
function Top10Card({
  product,
  index,
  citySlug,
  fallbackPhoto,
}: {
  product: TiqetsProduct;
  index: number;
  citySlug: string;
  fallbackPhoto: string;
}) {
  const fallback = `https://images.unsplash.com/${fallbackPhoto}?w=560&h=420&fit=crop`;
  const img = product.images?.[0] || fallback;
  const avg = product.ratings?.average ?? 0;
  const price = Math.floor(product.price || 0);

  return (
    <Link
      href={`/attractions/${citySlug}/${product.id}`}
      className="group flex-shrink-0 w-[260px] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={img}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
        {/* Number badge */}
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-[#2B7FFF] text-white font-extrabold text-[15px] flex items-center justify-center shadow-md">
          {index + 1}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-[#0F172A] line-clamp-2 mb-1.5 leading-snug">
          {product.title}
        </h3>
        {avg > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-yellow-400 text-[12px]">★</span>
            <span className="text-[12px] font-semibold text-[#0F172A]">{avg.toFixed(1)}</span>
            <span className="text-[11px] text-[#64748B]">({(product.ratings?.total ?? 0).toLocaleString()})</span>
          </div>
        )}
        {price > 0 && (
          <p className="text-[13px] font-bold text-[#0F172A]">From ${price}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── PRODUCT CARD ───────────────────────────────────────────── */
function ProductCard({
  product,
  citySlug,
  fallbackPhoto,
}: {
  product: TiqetsProduct;
  citySlug: string;
  fallbackPhoto: string;
}) {
  const fallback = `https://images.unsplash.com/${fallbackPhoto}?w=560&h=420&fit=crop`;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (product.images && product.images.length > 0) {
      setImageUrl(product.images[0]);
      setImgLoading(false);
      return;
    }
    if (product.product_url) {
      fetch(`/api/tiqets/product-image?product_url=${encodeURIComponent(product.product_url)}`)
        .then(r => r.json())
        .then(d => setImageUrl(d.imageUrl || fallback))
        .catch(() => setImageUrl(fallback))
        .finally(() => setImgLoading(false));
    } else {
      setImageUrl(fallback);
      setImgLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBestseller = product.promo_label === 'bestseller';
  const isSkipLine = product.skip_line || product.tag_ids?.includes(1711);
  const price = Math.floor(product.price || 0);
  const avg = product.ratings?.average ?? 0;
  const total = product.ratings?.total ?? 0;

  return (
    <Link
      href={`/attractions/${citySlug}/${product.id}`}
      className="group cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {imgLoading ? (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : null}
        {isBestseller && (
          <span className="absolute top-2 left-2 bg-[#FF6B35] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
            Bestseller
          </span>
        )}
        {isSkipLine && (
          <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded">
            Skip Line
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-[14px] font-semibold text-[#0F172A] line-clamp-2 mb-1.5 leading-snug flex-1">
          {product.title}
        </h3>
        {avg > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-yellow-400 text-[13px]">★</span>
            <span className="text-[13px] font-semibold text-[#0F172A]">{avg.toFixed(1)}</span>
            <span className="text-[12px] text-[#64748B]">({total.toLocaleString()})</span>
          </div>
        )}
        {product.duration && (
          <p className="text-[12px] text-[#64748B] mb-1.5">⏱ {product.duration}</p>
        )}
        {price > 0 && (
          <p className="text-[15px] font-bold text-[#0F172A] mt-auto">From ${price}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── DB ATTRACTION CARD ─────────────────────────────────────── */
function DbAttractionCard({ attraction }: { attraction: AttractionItem }) {
  const fallback = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=560&h=420&fit=crop';
  const img = attraction.imageUrl || fallback;
  const isEvening = attraction.isEvening;

  return (
    <div className={`group rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col ${isEvening ? 'ring-1 ring-[#6366F1]/20' : ''}`}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={img}
          alt={attraction.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
        {isEvening && (
          <span className="absolute top-2 left-2 bg-[#4F46E5] text-white text-[11px] font-bold px-2 py-0.5 rounded">
            🌃 Night
          </span>
        )}
        {attraction.bestTime && !isEvening && (
          <span className="absolute top-2 left-2 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded capitalize">
            {attraction.bestTime}
          </span>
        )}
      </div>
      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-[14px] font-semibold text-[#0F172A] line-clamp-2 mb-1 leading-snug flex-1">
          {attraction.nameKo || attraction.name}
        </h3>
        <p className="text-[12px] text-[#64748B] line-clamp-2 mb-2">{attraction.descKo || attraction.desc}</p>
        {attraction.duration && (
          <p className="text-[12px] text-[#94A3B8] mb-2">⏱ {attraction.duration}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          {attraction.price > 0 ? (
            <p className="text-[15px] font-bold text-[#0F172A]">
              From {attraction.currency}{attraction.price}
            </p>
          ) : (
            <p className="text-[14px] font-semibold text-[#10B981]">Free</p>
          )}
          <a
            href={attraction.tiqetsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#2B7FFF] text-white text-[12px] font-semibold hover:bg-[#1D6AE5] transition-colors whitespace-nowrap"
          >
            Book on Tiqets
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── VENUE CARD ─────────────────────────────────────────────── */
function VenueCard({
  name,
  address,
  count,
  cityPhoto,
}: {
  name: string;
  address?: string;
  count: number;
  cityPhoto: string;
}) {
  const fallback = `https://images.unsplash.com/${cityPhoto}?w=400&h=300&fit=crop`;
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image src={fallback} alt={name} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 text-white">
          <p className="text-[13px] font-bold leading-tight line-clamp-2">{name}</p>
          <p className="text-[11px] text-white/75">{count} experience{count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {address && (
        <div className="px-3 py-2">
          <p className="text-[11px] text-[#64748B] line-clamp-1">📍 {address}</p>
        </div>
      )}
    </div>
  );
}

/* ─── PAGE ───────────────────────────────────────────────────── */
export default function CityAttractionsPage() {
  const params = useParams();
  const citySlug = params.city as string;
  const cityInfo = CITY_MAP[citySlug];

  const [products, setProducts] = useState<TiqetsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(24);
  const [sort, setSort] = useState<SortKey>('popular');
  const [searchQuery, setSearchQuery] = useState('');   // 실제 필터에 적용되는 값
  const [inputValue, setInputValue] = useState('');     // 입력창 표시값 (즉시 반영)
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>(''); // tag_id string
  const [showMoreModal, setShowMoreModal] = useState(false);

  // 자동완성 후보 (inputValue 기준, 2글자 이상, 최대 7개)
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];
    const q = inputValue.toLowerCase();
    return products
      .filter(p => p.title.toLowerCase().includes(q))
      .slice(0, 7)
      .map(p => p.title);
  }, [inputValue, products]);

  // 검색 실행 (버튼 클릭 or Enter)
  function handleSearch() {
    setSearchQuery(inputValue);
    setShowSuggestions(false);
    setDisplayCount(24);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  // 초기화
  function handleClear() {
    setInputValue('');
    setSearchQuery('');
    setShowSuggestions(false);
    setDisplayCount(24);
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [dbAttractions, setDbAttractions] = useState<AttractionItem[]>([]);

  const fetchProducts = useCallback(async () => {
    if (!cityInfo) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tiqets/city-with-images?city_id=${cityInfo.id}&city_url=${encodeURIComponent(cityInfo.tiqetsSlug)}`
      );
      const data = await res.json();
      const tiqetsProducts = data.products || [];
      setProducts(tiqetsProducts);
      // If Tiqets returns no products, load from local DB
      if (tiqetsProducts.length === 0) {
        const normalizedSlug = citySlug.replace(/-/g, ' ');
        setDbAttractions(getAttractionsByCity(normalizedSlug));
      }
    } catch {
      setProducts([]);
      const normalizedSlug = citySlug.replace(/-/g, ' ');
      setDbAttractions(getAttractionsByCity(normalizedSlug));
    } finally {
      setLoading(false);
    }
  }, [cityInfo, citySlug]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ─── Filter & sort ───────────────────── */
  let filtered = products.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (activeCategory) {
    filtered = filtered.filter(p =>
      p.tag_ids?.map(String).includes(activeCategory)
    );
  }
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'price_asc':  return (a.price || 0) - (b.price || 0);
      case 'price_desc': return (b.price || 0) - (a.price || 0);
      case 'rating':     return (b.ratings?.average || 0) - (a.ratings?.average || 0);
      default:           return (b.ratings?.total || 0) - (a.ratings?.total || 0);
    }
  });

  /* ─── Top 10 (rating sorted, best first) ─ */
  const top10 = [...products]
    .sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0))
    .slice(0, 10);

  /* ─── Points of Interest (venues) ────────── */
  const venueMap = new Map<string, { address?: string; count: number }>();
  products.forEach(p => {
    const vName = p.venue?.name;
    if (!vName) return;
    const existing = venueMap.get(vName);
    if (existing) existing.count++;
    else venueMap.set(vName, { address: p.venue?.address, count: 1 });
  });
  const venues = [...venueMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const displayed = sorted.slice(0, displayCount);
  const hasMore = displayed.length < sorted.length;

  if (!cityInfo) {
    return (
      <div className="min-h-screen bg-white">
        <Header hideSearch />
        <div className="flex items-center justify-center h-64">
          <p className="text-[#64748B] text-[18px]">City not found.</p>
        </div>
      </div>
    );
  }

  const heroUrl = `https://images.unsplash.com/${cityInfo.photo}?w=1600&h=800&fit=crop`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header hideSearch />

      {/* ─── 1. HERO ──────────────────────────────────────── */}
      <section className="relative h-[400px] flex flex-col justify-end pb-10">
        <Image src={heroUrl} alt={cityInfo.name} fill className="object-cover" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-3">
            <Link href="/attractions" className="hover:text-white transition-colors">Attractions</Link>
            <span>›</span>
            <span className="text-white/90">{cityInfo.name}</span>
          </div>
          {/* H1 */}
          <h1 className="text-[42px] sm:text-[52px] font-extrabold text-white mb-2 leading-tight">
            Things to do in {cityInfo.name}
          </h1>
          <p className="text-white/75 text-[15px] mb-6">
            {products.length > 0 ? `${products.length}+` : '100+'} Experiences · Skip the Line · Book Online
          </p>
          {/* Search bar + Autocomplete */}
          <div ref={searchRef} className="relative max-w-[560px]">
            <div className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2B7FFF]">
              <svg className="ml-4 flex-shrink-0 text-[#94A3B8]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch();
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                placeholder={`Search experiences in ${cityInfo.name}...`}
                className="flex-1 px-3 py-3.5 text-[#0F172A] text-[15px] outline-none placeholder:text-[#94A3B8] bg-transparent"
              />
              {/* Clear */}
              {inputValue && (
                <button
                  onClick={handleClear}
                  className="flex-shrink-0 w-6 h-6 mr-2 flex items-center justify-center rounded-full bg-[#E5E7EB] text-[#64748B] hover:bg-[#CBD5E1] text-[14px] leading-none"
                >×</button>
              )}
              {/* Search button */}
              <button
                onClick={handleSearch}
                className="flex-shrink-0 m-1.5 px-5 py-2.5 rounded-lg bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white text-[14px] font-semibold transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden z-50">
                {suggestions.map((title, i) => (
                  <button
                    key={i}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { setInputValue(title); setSearchQuery(title); setShowSuggestions(false); setDisplayCount(24); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F1F5F9] transition-colors border-b border-[#F1F5F9] last:border-0"
                  >
                    <svg className="text-[#94A3B8] flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <span className="text-[14px] text-[#0F172A] line-clamp-1">{title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. TOP 10 ────────────────────────────────────── */}
      {!loading && top10.length > 0 && (
        <section className="bg-white py-10 border-b border-[#E5E7EB]">
          <div className="max-w-[1280px] mx-auto px-4">
            <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
              Top 10 things to do in {cityInfo.name}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
              {top10.map((p, i) => (
                <Top10Card
                  key={p.id}
                  product={p}
                  index={i}
                  citySlug={citySlug}
                  fallbackPhoto={cityInfo.photo}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 3. CATEGORY FILTER (인라인) ─────────────────── */}
      <section className="bg-white py-6 border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="text-[18px] font-extrabold text-[#0F172A] mb-4">
            Browse by category
          </h2>
          <div className="flex flex-wrap gap-2">
            {[{ id: '', label: 'All', icon: '✨' }, ...(CITY_CATEGORIES[citySlug] || [])].map(cat => (
              <button
                key={cat.id || 'all'}
                onClick={() => { setActiveCategory(cat.id); setDisplayCount(24); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold border transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-[#F8FAFC] text-[#374151] border-[#E2E8F0] hover:border-[#0F172A] hover:text-[#0F172A]'
                }`}
              >
                <span className="text-[16px]">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
            <button
              onClick={() => setShowMoreModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold border border-dashed border-[#CBD5E1] text-[#64748B] hover:border-[#0F172A] hover:text-[#0F172A] transition-all bg-white"
            >
              More categories ↓
            </button>
          </div>
        </div>
      </section>

      {/* ─── 4. SORT BAR ───────────────────────────────────── */}
      <div ref={resultsRef} className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#0F172A] inline mr-3">
                All experiences in {cityInfo.name}
              </h2>
              <span className="text-[13px] text-[#64748B]">
                {loading ? 'Loading…' : `${sorted.length} experiences found`}
              </span>
            </div>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value as SortKey); setDisplayCount(24); }}
              className="text-[12px] font-semibold text-[#374151] border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none focus:border-[#2B7FFF] cursor-pointer bg-white"
            >
              <option value="popular">Popular</option>
              <option value="rating">Rating</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── More Categories 모달 ────────────────────────────── */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMoreModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] sticky top-0 bg-white">
              <h3 className="text-[18px] font-bold text-[#0F172A]">All Categories</h3>
              <button
                onClick={() => setShowMoreModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B] text-[20px] leading-none"
              >×</button>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => { setActiveCategory(''); setDisplayCount(24); setShowMoreModal(false); }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold border transition-all ${
                  activeCategory === '' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-[#F8FAFC] text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30'
                }`}
              >
                <span>✨</span> All
              </button>
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setDisplayCount(24); setShowMoreModal(false); }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold border transition-all text-left ${
                    activeCategory === cat.id ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-[#F8FAFC] text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30'
                  }`}
                >
                  <span className="flex-shrink-0">{cat.icon}</span>
                  <span className="leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. MAIN GRID ──────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : sorted.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayed.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  citySlug={citySlug}
                  fallbackPhoto={cityInfo.photo}
                />
              ))}
            </div>

            {/* ─── 6. LOAD MORE ─────────────────────────── */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setDisplayCount(c => c + 24)}
                  className="px-10 py-3.5 rounded-xl bg-[#0F172A] text-white font-semibold text-[15px] hover:bg-[#1E293B] transition-colors"
                >
                  Load More Experiences
                </button>
              </div>
            )}
          </>
        ) : dbAttractions.length > 0 ? (
          /* ─── DB ATTRACTIONS FALLBACK ───────────────── */
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[15px] font-semibold text-[#0F172A]">Handpicked Experiences</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2B7FFF] text-[11px] font-semibold">
                {dbAttractions.length} curated
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {dbAttractions.map(a => (
                <DbAttractionCard key={a.id} attraction={a} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#94A3B8] text-[18px] mb-3">No experiences found</p>
            <button
              onClick={() => { setActiveCategory(''); handleClear(); }}
              className="text-[#2B7FFF] text-[14px] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ─── 7. POINTS OF INTEREST ───────────────────────── */}
        {!loading && venues.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[22px] font-extrabold text-[#0F172A] mb-5">
              Points of interest in {cityInfo.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {venues.map(([name, info]) => (
                <VenueCard
                  key={name}
                  name={name}
                  address={info.address}
                  count={info.count}
                  cityPhoto={cityInfo.photo}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
