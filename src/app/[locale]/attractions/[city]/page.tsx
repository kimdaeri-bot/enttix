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
  florence:      { id: 71854,  name: 'Florence',     tiqetsSlug: 'florence-attractions-c71854',     photo: 'photo-1504433374832-4fcf45f40967', desc: 'The cradle of the Renaissance — Uffizi Gallery, Duomo and Michelangelo\'s David.' },
  lisbon:        { id: 76528,  name: 'Lisbon',       tiqetsSlug: 'lisbon-attractions-c76528',       photo: 'photo-1563206767-5b18f218e8de', desc: 'Pastel-coloured hills, trams, Fado music and the world\'s best custard tarts.' },
  venice:        { id: 71510,  name: 'Venice',       tiqetsSlug: 'venice-attractions-c71510',       photo: 'photo-1523906834658-6e24ef2386f9', desc: 'Glide through canals, explore the Doge\'s Palace and lose yourself in ancient alleyways.' },
  berlin:        { id: 65144,  name: 'Berlin',       tiqetsSlug: 'berlin-attractions-c65144',       photo: 'photo-1560969184-10fe8719e047', desc: 'History, art and nightlife collide — from the Brandenburg Gate to Museum Island.' },
  milan:         { id: 71749,  name: 'Milan',        tiqetsSlug: 'milan-attractions-c71749',        photo: 'photo-1520175480921-4edfa2983e0f', desc: 'Fashion, design and da Vinci\'s Last Supper in the style capital of the world.' },
  krakow:        { id: 46,     name: 'Krakow',       tiqetsSlug: 'krakow-attractions-c46',          photo: 'photo-1519197924294-4ba991a11128', desc: 'Medieval charm, Wawel Castle and a powerful history in Poland\'s cultural heart.' },
  sydney:        { id: 60400,  name: 'Sydney',       tiqetsSlug: 'sydney-attractions-c60400',       photo: 'photo-1506973035872-a4ec16b8e8d9', desc: 'Iconic Opera House, Harbour Bridge, stunning beaches and a vibrant food scene.' },
  athens:        { id: 99239,  name: 'Athens',       tiqetsSlug: 'athens-attractions-c99239',       photo: 'photo-1555993539-1732b0258235', desc: 'Walk in the footsteps of ancient philosophers — the Acropolis, Parthenon and beyond.' },
  bangkok:       { id: 78586,  name: 'Bangkok',      tiqetsSlug: 'bangkok-attractions-c78586',      photo: 'photo-1508009603885-50cf7c579365', desc: 'Glittering temples, floating markets, street food and electrifying nightlife.' },
  edinburgh:     { id: 21,     name: 'Edinburgh',    tiqetsSlug: 'edinburgh-attractions-c21',       photo: 'photo-1580418827493-f2b22c0a76cb', desc: 'A dramatic castle on volcanic rock, whisky trails and the world\'s biggest arts festival.' },
  dublin:        { id: 68616,  name: 'Dublin',       tiqetsSlug: 'dublin-attractions-c68616',       photo: 'photo-1555921015-5532091f6026', desc: 'Guinness, Georgian streets, Viking history and the warmest pubs in Europe.' },
  'mexico-city': { id: 74040,  name: 'Mexico City',  tiqetsSlug: 'mexico-city-attractions-c74040',  photo: 'photo-1518105779142-d975f22f1b0a', desc: 'Ancient pyramids, Frida Kahlo, street tacos and one of the world\'s great capital cities.' },
  munich:        { id: 31,     name: 'Munich',       tiqetsSlug: 'munich-attractions-c31',          photo: 'photo-1595867818082-083862f3d630', desc: 'Oktoberfest, fairytale castles, BMW museums and Alpine day trips.' },
  budapest:      { id: 68199,  name: 'Budapest',     tiqetsSlug: 'budapest-attractions-c68199',     photo: 'photo-1551867633-194f125bddfa', desc: 'Thermal baths, stunning Parliament building and Danube river cruises.' },
  brussels:      { id: 60843,  name: 'Brussels',     tiqetsSlug: 'brussels-attractions-c60843',     photo: 'photo-1491557345352-5929e343eb89', desc: 'Art Nouveau architecture, world-famous chocolate, waffles and the EU quarter.' },
  'cape-town':   { id: 82923,  name: 'Cape Town',    tiqetsSlug: 'cape-town-attractions-c82923',    photo: 'photo-1580060839134-75a5edca2e99', desc: 'Table Mountain, penguin colonies, wine routes and the Cape of Good Hope.' },
  cairo:         { id: 65792,  name: 'Cairo',        tiqetsSlug: 'cairo-attractions-c65792',        photo: 'photo-1572252009286-268acec5ca0a', desc: 'The Great Pyramids, Sphinx, Egyptian Museum and the timeless River Nile.' },
  bali:          { id: 267738, name: 'Bali',         tiqetsSlug: 'bali-attractions-c267738',        photo: 'photo-1537996194471-e657df975ab4', desc: 'Rice terraces, sacred temples, surf beaches and a unique Hindu culture.' },
  bruges:        { id: 60844,  name: 'Bruges',       tiqetsSlug: 'bruges-attractions-c60844',       photo: 'photo-1491557345352-5929e343eb89', desc: 'The Venice of the North — canals, medieval architecture and world-class beer.' },
  osaka:         { id: 28,     name: 'Osaka',        tiqetsSlug: 'osaka-attractions-c28',           photo: 'photo-1589308078059-be1415eab4c3', desc: 'Street food paradise, neon-lit Dotonbori, Universal Studios and vibrant nightlife.' },
  kyoto:         { id: 72420,  name: 'Kyoto',        tiqetsSlug: 'kyoto-attractions-c72420',        photo: 'photo-1528360983277-13d401cdc186', desc: 'Ancient temples, geisha districts, bamboo groves and the essence of traditional Japan.' },
  seoul:         { id: 73067,  name: 'Seoul',        tiqetsSlug: 'seoul-attractions-c73067',        photo: 'photo-1538485399081-7191377e8241', desc: 'K-pop culture, royal palaces, cutting-edge tech and incredible Korean cuisine.' },
  // ── Europe 신규
  naples:          { id: 71720,  name: 'Naples',          tiqetsSlug: 'naples-attractions-c71720',          photo: 'photo-1534445867742-43195f401b6c',  desc: "Where Vesuvius looms over pizza, ancient ruins and the world's most passionate street life." },
  porto:           { id: 76573,  name: 'Porto',           tiqetsSlug: 'porto-attractions-c76573',           photo: 'photo-1555881400-74d7acaacd8b',     desc: "Port wine cellars, tiled azulejo buildings and the romantic Douro River." },
  reykjavik:       { id: 22,     name: 'Reykjavik',       tiqetsSlug: 'reykjavik-attractions-c22',          photo: 'photo-1531971589569-0d9370cbe1e5',  desc: "Northern Lights, geysers, hot springs and midnight sun in Iceland's extraordinary capital." },
  seville:         { id: 65870,  name: 'Seville',         tiqetsSlug: 'seville-attractions-c65870',         photo: 'photo-1519125323398-675f0ddb6308',  desc: "Flamenco, Gothic cathedral, orange trees and the golden light of Andalusia." },
  hamburg:         { id: 64886,  name: 'Hamburg',         tiqetsSlug: 'hamburg-attractions-c64886',         photo: 'photo-1504109586057-7a2ae83d1338',     desc: "Germany's port city — Speicherstadt warehouses, Reeperbahn nightlife and the Elbphilharmonie." },
  copenhagen:      { id: 113,    name: 'Copenhagen',      tiqetsSlug: 'copenhagen-attractions-c113',        photo: 'photo-1513622470522-26c3c8a854bc',  desc: "The Little Mermaid, Nyhavn canals, Tivoli Gardens and the world's happiest capital." },
  palermo:         { id: 71428,  name: 'Palermo',         tiqetsSlug: 'palermo-attractions-c71428',         photo: 'photo-1533929736458-ca588d08c8be',  desc: "Sicily's capital: Arab-Norman architecture, street food markets and Baroque splendor." },
  stockholm:       { id: 1638,   name: 'Stockholm',       tiqetsSlug: 'stockholm-attractions-c1638',        photo: 'photo-1509356843151-3e7d96241e11',  desc: "Built on 14 islands, home to the Vasa Museum, ABBA Museum and Nordic design." },
  verona:          { id: 71506,  name: 'Verona',          tiqetsSlug: 'verona-attractions-c71506',          photo: 'photo-1534430480872-3498386e7856',  desc: "Shakespeare's city of love — the Roman Arena, Juliet's balcony and endless romance." },
  nice:            { id: 66770,  name: 'Nice',            tiqetsSlug: 'nice-attractions-c66770',            photo: 'photo-1549144511-f099e773c147',  desc: "Azure coast, Promenade des Anglais, old town markets and gateway to the French Riviera." },
  turin:           { id: 71534,  name: 'Turin',           tiqetsSlug: 'turin-attractions-c71534',           photo: 'photo-1564501049412-61c2a3083791',  desc: "Italy's elegant baroque city — Mole Antonelliana, Egyptian Museum and world-class chocolate." },
  helsinki:        { id: 66544,  name: 'Helsinki',        tiqetsSlug: 'helsinki-attractions-c66544',        photo: 'photo-1548690312-e3b507d8c110',     desc: "Design capital on the Baltic — cathedral, Suomenlinna fortress, saunas and design districts." },
  bologna:         { id: 71986,  name: 'Bologna',         tiqetsSlug: 'bologna-attractions-c71986',         photo: 'photo-1558618666-fcd25c85cd64',     desc: "Italy's food capital with medieval towers, porticoes and the oldest university in the world." },
  warsaw:          { id: 485,    name: 'Warsaw',          tiqetsSlug: 'warsaw-attractions-c485',            photo: 'photo-1549144511-f099e773c147',     desc: "Rebuilt from rubble — Warsaw's Old Town, Chopin heritage and a vibrant modern skyline." },
  rhodes:          { id: 264570, name: 'Rhodes',          tiqetsSlug: 'rhodes-attractions-c264570',         photo: 'photo-1541364983171-a8ba01e95cfc',  desc: "Medieval walled city, ancient Acropolis and crystal-clear Aegean beaches." },
  bordeaux:        { id: 67101,  name: 'Bordeaux',        tiqetsSlug: 'bordeaux-attractions-c67101',        photo: 'photo-1464822759023-fed622ff2c3b',     desc: "The wine capital of the world — 18th-century architecture and La Cité du Vin." },
  cologne:         { id: 64765,  name: 'Cologne',         tiqetsSlug: 'cologne-attractions-c64765',         photo: 'photo-1548248823-ce16a73b6d49',     desc: "Gothic cathedral, Roman history, craft beer scene and legendary Carnival celebrations." },
  valletta:        { id: 73787,  name: 'Valletta',        tiqetsSlug: 'valletta-attractions-c73787',        photo: 'photo-1548690312-e3b507d8c110',  desc: "Europe's smallest capital — baroque palaces, Caravaggio paintings and Grand Harbour views." },
  dresden:         { id: 65042,  name: 'Dresden',         tiqetsSlug: 'dresden-attractions-c65042',         photo: 'photo-1562547256-2c5ee93b60b7',     desc: "Florence on the Elbe — Baroque churches, world-class art galleries and riverside walks." },
  salzburg:        { id: 60346,  name: 'Salzburg',        tiqetsSlug: 'salzburg-attractions-c60346',        photo: 'photo-1543610892-0b1f7e6d8ac1',  desc: "Sound of Music, Mozart's birthplace, Hohensalzburg fortress and Alpine views." },
  zurich:          { id: 20,     name: 'Zurich',          tiqetsSlug: 'zurich-attractions-c20',             photo: 'photo-1515488042361-ee00e0ddd4e4',  desc: "Switzerland's stylish city on Lake Zurich — old town, Swiss cuisine and mountain day trips." },
  oslo:            { id: 75084,  name: 'Oslo',            tiqetsSlug: 'oslo-attractions-c75084',            photo: 'photo-1562183241-b937e95585b6',     desc: "Viking ships, the Munch Museum, Vigeland sculptures and Norway's fjord gateway." },
  innsbruck:       { id: 60358,  name: 'Innsbruck',       tiqetsSlug: 'innsbruck-attractions-c60358',       photo: 'photo-1507003211169-0a1dd7228f2d',  desc: "Alpine city of emperors — Golden Roof, ski slopes and breathtaking mountain scenery." },
  tallinn:         { id: 65702,  name: 'Tallinn',         tiqetsSlug: 'tallinn-attractions-c65702',         photo: 'photo-1554118811-1e0d58224f24',     desc: "One of Europe's best-preserved medieval Old Towns, on the shores of the Baltic Sea." },
  vilnius:         { id: 73352,  name: 'Vilnius',         tiqetsSlug: 'vilnius-attractions-c73352',         photo: 'photo-1507272931001-fc06c17e4f43',     desc: "Lithuania's baroque capital — Gediminas Castle, Gate of Dawn and a thriving café culture." },
  lucerne:         { id: 62662,  name: 'Lucerne',         tiqetsSlug: 'lucerne-attractions-c62662',         photo: 'photo-1540959733332-eab4deabeeaf',  desc: "Switzerland's most romantic city — Chapel Bridge, Lake Lucerne and the Alps." },
  // ── EMEA 신규
  'abu-dhabi':     { id: 60013,  name: 'Abu Dhabi',       tiqetsSlug: 'abu-dhabi-attractions-c60013',       photo: 'photo-1512632578888-169bbbc64f33',  desc: "Sheikh Zayed Mosque, Ferrari World, Louvre Abu Dhabi and the UAE's grand capital." },
  marrakesh:       { id: 73471,  name: 'Marrakesh',       tiqetsSlug: 'marrakesh-attractions-c73471',       photo: 'photo-1487222477894-8943e31ef7b2',  desc: "Medina souks, Djemaa el-Fna square, riads, hammams and the gateway to the Sahara." },
  hurghada:        { id: 44,     name: 'Hurghada',        tiqetsSlug: 'hurghada-attractions-c44',           photo: 'photo-1523805009345-7448845a9e53',  desc: "Red Sea diving, snorkeling, boat trips and resort beaches on Egypt's Red Sea coast." },
  luxor:           { id: 65786,  name: 'Luxor',           tiqetsSlug: 'luxor-attractions-c65786',           photo: 'photo-1552832230-c0197dd311b5',     desc: "The world's greatest open-air museum — Karnak Temple, Valley of the Kings and Nile cruises." },
  doha:            { id: 76635,  name: 'Doha',            tiqetsSlug: 'doha-attractions-c76635',            photo: 'photo-1542816417-0983c9c9ad53',     desc: "Museum of Islamic Art, Katara Cultural Village, Souq Waqif and Qatar's futuristic skyline." },
  // ── Americas 신규
  'las-vegas':     { id: 82073,  name: 'Las Vegas',       tiqetsSlug: 'las-vegas-attractions-c82073',       photo: 'photo-1520209268518-aec60b8bb5ca',  desc: "The Entertainment Capital of the World — shows, casinos, Cirque du Soleil and the Strip." },
  'san-francisco': { id: 1772,   name: 'San Francisco',   tiqetsSlug: 'san-francisco-attractions-c1772',    photo: 'photo-1506146332389-18140dc7b2fb',  desc: "Golden Gate Bridge, Alcatraz, cable cars and the Bay Area's legendary food scene." },
  'los-angeles':   { id: 81810,  name: 'Los Angeles',     tiqetsSlug: 'los-angeles-attractions-c81810',     photo: 'photo-1534190239940-9ba8944ea261',     desc: "Hollywood, Universal Studios, Griffith Observatory and year-round California sunshine." },
  miami:           { id: 79868,  name: 'Miami',           tiqetsSlug: 'miami-attractions-c79868',           photo: 'photo-1533106418989-88406c7cc8ca',  desc: "Art Deco beaches, Wynwood Walls, South Beach nightlife and Cuban culture in Little Havana." },
  chicago:         { id: 80816,  name: 'Chicago',         tiqetsSlug: 'chicago-attractions-c80816',         photo: 'photo-1477959858617-67f85cf4f1df',  desc: "The Bean, deep-dish pizza, jazz, blues and the world's most iconic modern architecture." },
  vancouver:       { id: 62496,  name: 'Vancouver',       tiqetsSlug: 'vancouver-attractions-c62496',       photo: 'photo-1559511260-66a654ae982a',     desc: "Mountains meet ocean — Stanley Park, Granville Island, whale watching and Pacific Rim food." },
  boston:          { id: 80874,  name: 'Boston',          tiqetsSlug: 'boston-attractions-c80874',          photo: 'photo-1498050108023-c5249f4df085',  desc: "Freedom Trail, Harvard, lobster rolls and America's most historically rich city." },
  tulum:           { id: 109113, name: 'Tulum',           tiqetsSlug: 'tulum-attractions-c109113',          photo: 'photo-1547447134-cd3f5c716030',  desc: "Clifftop Mayan ruins, cenotes, white beaches and eco-chic jungle retreats." },
  toronto:         { id: 62492,  name: 'Toronto',         tiqetsSlug: 'toronto-attractions-c62492',         photo: 'photo-1517090504586-fde19ea6066f',  desc: "CN Tower, diverse neighborhoods, Niagara Falls day trips and Canada's cultural capital." },
  'new-orleans':   { id: 80162,  name: 'New Orleans',     tiqetsSlug: 'new-orleans-attractions-c80162',     photo: 'photo-1556702571-3e11dd2b1a92',  desc: "Jazz music, Mardi Gras, Bourbon Street, ghost tours and Creole cuisine." },
  'playa-del-carmen':{ id: 73927, name: 'Playa del Carmen',tiqetsSlug:'playa-del-carmen-attractions-c73927', photo: 'photo-1566073771259-6a8506099945',    desc: "Caribbean beaches, 5th Avenue shopping, cenotes and the Riviera Maya's beating heart." },
  'washington-dc': { id: 79751,  name: 'Washington DC',   tiqetsSlug: 'washington-dc-attractions-c79751',   photo: 'photo-1501466044931-62695aada8e9',  desc: "Monuments, free Smithsonian museums, the Capitol and the seat of American democracy." },
  'buenos-aires':  { id: 60189,  name: 'Buenos Aires',    tiqetsSlug: 'buenos-aires-attractions-c60189',    photo: 'photo-1612294037637-ec328d0e075e',  desc: "Tango, steak, La Boca colors and the Paris of South America." },
  montreal:        { id: 25,     name: 'Montreal',        tiqetsSlug: 'montreal-attractions-c25',           photo: 'photo-1534105615256-13940a56ff44',     desc: "French flair in North America — festivals, bagels, underground city and vibrant art scene." },
  'rio-de-janeiro':{ id: 61535,  name: 'Rio de Janeiro',  tiqetsSlug: 'rio-de-janeiro-attractions-c61535',  photo: 'photo-1483729558449-99ef09a8c325',  desc: "Christ the Redeemer, Copacabana, samba, Carnival and breathtaking Sugarloaf Mountain." },
  cusco:           { id: 75323,  name: 'Cusco',           tiqetsSlug: 'cusco-attractions-c75323',           photo: 'photo-1506905925346-21bda4d32df4',  desc: "Gateway to Machu Picchu — Inca heritage, colonial churches and Andean culture at 3,400m." },
  // ── APAC 신규
  melbourne:       { id: 60426,  name: 'Melbourne',       tiqetsSlug: 'melbourne-attractions-c60426',       photo: 'photo-1523482580672-f109ba8cb9be',  desc: "Coffee capital, street art, MCG, Great Ocean Road day trips and the Australian Open." },
  phuket:          { id: 78451,  name: 'Phuket',          tiqetsSlug: 'phuket-attractions-c78451',          photo: 'photo-1519046904884-53103b34b206',     desc: "Crystal-clear bays, Phi Phi Islands, Big Buddha, Bangla Road and the Andaman Sea." },
  cairns:          { id: 60466,  name: 'Cairns',          tiqetsSlug: 'cairns-attractions-c60466',          photo: 'photo-1518391846015-55a9cc003b25',  desc: "Gateway to the Great Barrier Reef and Daintree Rainforest — the world's natural wonders." },
  'gold-coast':    { id: 60442,  name: 'Gold Coast',      tiqetsSlug: 'gold-coast-attractions-c60442',      photo: 'photo-1507525428034-b723cf961d3e',  desc: "Surfers Paradise, theme parks, beaches and Australia's most glamorous resort city." },
  'ho-chi-minh':   { id: 272460, name: 'Ho Chi Minh',     tiqetsSlug: 'ho-chi-minh-attractions-c272460',    photo: 'photo-1557804506-669a67965ba0',  desc: "War Remnants Museum, Cu Chi Tunnels, French colonial buildings and Vietnam's economic hub." },
  'kuala-lumpur':  { id: 74416,  name: 'Kuala Lumpur',    tiqetsSlug: 'kuala-lumpur-attractions-c74416',    photo: 'photo-1596422846543-75c6fc197f07',  desc: "Petronas Towers, Batu Caves, diverse street food and a melting pot of Asian cultures." },
  'siem-reap':     { id: 72961,  name: 'Siem Reap',       tiqetsSlug: 'siem-reap-attractions-c72961',       photo: 'photo-1506197603052-3cc9c3a201bd',     desc: "Angkor Wat — the world's largest religious monument and the jewel of Khmer civilization." },
  'chiang-mai':    { id: 78479,  name: 'Chiang Mai',      tiqetsSlug: 'chiang-mai-attractions-c78479',      photo: 'photo-1571003123894-1f0594d2b5d9',  desc: "300 ancient temples, elephant sanctuaries, night markets and the gateway to northern Thailand." },
  hanoi:           { id: 82689,  name: 'Hanoi',           tiqetsSlug: 'hanoi-attractions-c82689',           photo: 'photo-1528360983277-13d401cdc186',     desc: "Hoan Kiem Lake, Old Quarter street food, Ho Chi Minh Mausoleum and Halong Bay trips." },
  'phnom-penh':    { id: 72955,  name: 'Phnom Penh',      tiqetsSlug: 'phnom-penh-attractions-c72955',      photo: 'photo-1594322436404-5a0526db4d13',  desc: "Royal Palace, Killing Fields memorial, Mekong riverfront and Cambodia's vibrant capital." },
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
  // ── Europe 신규
  'naples':          [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'710',label:'Places of Worship',icon:'⛪'}],
  'porto':           [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1033',label:'Workshops',icon:'🎓'}],
  'reykjavik':       [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'703',label:'Science',icon:'🔬'},{ id:'1049',label:'Rentals',icon:'🚲'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'seville':         [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'710',label:'Places of Worship',icon:'⛪'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'706',label:'Palaces',icon:'👑'}],
  'hamburg':         [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'copenhagen':      [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'palermo':         [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'710',label:'Places of Worship',icon:'⛪'}],
  'stockholm':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'verona':          [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'nice':            [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'708',label:'Historical Sites',icon:'🏛️'}],
  'turin':           [{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'helsinki':        [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'bologna':         [{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1033',label:'Workshops',icon:'🎓'}],
  'warsaw':          [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'rhodes':          [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1840',label:'Transfers',icon:'🚖'}],
  'bordeaux':        [{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'702',label:'History Museums',icon:'📜'}],
  'cologne':         [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'valletta':        [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'dresden':         [{ id:'702',label:'History Museums',icon:'📜'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'salzburg':        [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'705',label:'Castles',icon:'🏰'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'706',label:'Palaces',icon:'👑'}],
  'zurich':          [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'oslo':            [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'innsbruck':       [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'705',label:'Castles',icon:'🏰'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1049',label:'Rentals',icon:'🚲'},{ id:'1033',label:'Workshops',icon:'🎓'}],
  'tallinn':         [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'701',label:'Interactive Museums',icon:'🎭'}],
  'vilnius':         [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'701',label:'Interactive Museums',icon:'🎭'}],
  'lucerne':         [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'700',label:'Art Museums',icon:'🎨'}],
  // ── EMEA 신규
  'abu-dhabi':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1840',label:'Transfers',icon:'🚖'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'marrakesh':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1033',label:'Workshops',icon:'🎓'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'hurghada':        [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1840',label:'Transfers',icon:'🚖'},{ id:'1049',label:'Rentals',icon:'🚲'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'}],
  'luxor':           [{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1840',label:'Transfers',icon:'🚖'},{ id:'1040',label:'City Tours',icon:'🗺️'}],
  'doha':            [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'2596',label:'Shows',icon:'🎭'}],
  // ── Americas 신규
  'las-vegas':       [{ id:'2596',label:'Shows',icon:'🎭'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1840',label:'Transfers',icon:'🚖'}],
  'san-francisco':   [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'700',label:'Art Museums',icon:'🎨'}],
  'los-angeles':     [{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'miami':           [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'chicago':         [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'vancouver':       [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'701',label:'Interactive Museums',icon:'🎭'}],
  'boston':          [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'tulum':           [{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1049',label:'Rentals',icon:'🚲'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'712',label:'Theme Parks',icon:'🎡'}],
  'toronto':         [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'new-orleans':     [{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'701',label:'Interactive Museums',icon:'🎭'}],
  'playa-del-carmen':[{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'1049',label:'Rentals',icon:'🚲'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'2596',label:'Shows',icon:'🎭'}],
  'washington-dc':   [{ id:'702',label:'History Museums',icon:'📜'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'700',label:'Art Museums',icon:'🎨'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'buenos-aires':    [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'700',label:'Art Museums',icon:'🎨'}],
  'montreal':        [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1042',label:'Day Trips',icon:'🚌'}],
  'rio-de-janeiro':  [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'cusco':           [{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1840',label:'Transfers',icon:'🚖'},{ id:'1033',label:'Workshops',icon:'🎓'}],
  // ── APAC 신규
  'melbourne':       [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'700',label:'Art Museums',icon:'🎨'}],
  'phuket':          [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'cairns':          [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1035',label:'Cruises',icon:'🚢'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1840',label:'Transfers',icon:'🚖'},{ id:'723',label:'Zoos',icon:'🦁'}],
  'gold-coast':      [{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'723',label:'Zoos',icon:'🦁'},{ id:'1035',label:'Cruises',icon:'🚢'}],
  'ho-chi-minh':     [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'701',label:'Interactive Museums',icon:'🎭'}],
  'kuala-lumpur':    [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'712',label:'Theme Parks',icon:'🎡'},{ id:'701',label:'Interactive Museums',icon:'🎭'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'siem-reap':       [{ id:'709',label:'Archaeological Sites',icon:'⛏️'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1033',label:'Workshops',icon:'🎓'}],
  'chiang-mai':      [{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'1033',label:'Workshops',icon:'🎓'},{ id:'710',label:'Places of Worship',icon:'⛪'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'}],
  'hanoi':           [{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'2596',label:'Shows',icon:'🎭'},{ id:'702',label:'History Museums',icon:'📜'}],
  'phnom-penh':      [{ id:'708',label:'Historical Sites',icon:'🏛️'},{ id:'1040',label:'City Tours',icon:'🗺️'},{ id:'1042',label:'Day Trips',icon:'🚌'},{ id:'702',label:'History Museums',icon:'📜'},{ id:'1034',label:'Food & Drinks',icon:'🍽️'},{ id:'709',label:'Archaeological Sites',icon:'⛏️'}],
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

/* ─── TAG 기반 Unsplash 폴백 이미지 ────────────────────────── */
/* ─── 카테고리별 플레이스홀더 (이미지 없거나 완전 실패 시) ─── */
const TAG_PLACEHOLDER: Record<number, { bg: string; icon: string }> = {
  708:  { bg: 'linear-gradient(135deg,#78350f 0%,#b45309 100%)',  icon: '🏰' }, // Historical Sites
  709:  { bg: 'linear-gradient(135deg,#6b7280 0%,#9ca3af 100%)',  icon: '🗿' }, // Archaeological
  700:  { bg: 'linear-gradient(135deg,#4338ca 0%,#6366f1 100%)',  icon: '🎨' }, // Art Museums
  701:  { bg: 'linear-gradient(135deg,#0891b2 0%,#22d3ee 100%)',  icon: '🔬' }, // Interactive Museums
  702:  { bg: 'linear-gradient(135deg,#92400e 0%,#d97706 100%)',  icon: '🏛️' }, // History Museums
  703:  { bg: 'linear-gradient(135deg,#1e3a5f 0%,#3b82f6 100%)',  icon: '🔭' }, // Science
  705:  { bg: 'linear-gradient(135deg,#374151 0%,#6b7280 100%)',  icon: '🏯' }, // Castles
  706:  { bg: 'linear-gradient(135deg,#7c2d12 0%,#dc2626 100%)',  icon: '👑' }, // Palaces
  710:  { bg: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)',  icon: '⛪' }, // Places of Worship
  712:  { bg: 'linear-gradient(135deg,#dc2626 0%,#f97316 100%)',  icon: '🎡' }, // Theme Parks
  723:  { bg: 'linear-gradient(135deg,#166534 0%,#16a34a 100%)',  icon: '🦁' }, // Zoos
  725:  { bg: 'linear-gradient(135deg,#14532d 0%,#4ade80 100%)',  icon: '🌿' }, // Botanical
  1034: { bg: 'linear-gradient(135deg,#c2410c 0%,#f59e0b 100%)', icon: '🍽️' }, // Food
  1035: { bg: 'linear-gradient(135deg,#0c4a6e 0%,#0284c7 100%)', icon: '⛵' }, // Cruises
  1040: { bg: 'linear-gradient(135deg,#0f766e 0%,#14b8a6 100%)', icon: '🗺️' }, // City Tours
  1042: { bg: 'linear-gradient(135deg,#1d4ed8 0%,#60a5fa 100%)', icon: '🌍' }, // Day Trips
  2596: { bg: 'linear-gradient(135deg,#7c3aed 0%,#c084fc 100%)', icon: '🎭' }, // Shows
  1033: { bg: 'linear-gradient(135deg,#0e7490 0%,#06b6d4 100%)', icon: '🎓' }, // Workshops
};
const DEFAULT_TAG_PLACEHOLDER = { bg: 'linear-gradient(135deg,#1E3A8A 0%,#2B7FFF 100%)', icon: '🎫' };

function getTagPlaceholder(tag_ids?: number[]): { bg: string; icon: string } {
  if (tag_ids && tag_ids.length > 0) {
    for (const tid of tag_ids) {
      if (TAG_PLACEHOLDER[tid]) return TAG_PLACEHOLDER[tid];
    }
  }
  return DEFAULT_TAG_PLACEHOLDER;
}

const TAG_FALLBACKS: Record<number, string[]> = {
  708:  ['photo-1552832230-c0197dd311b5','photo-1519197924294-4ba991a11128','photo-1555993539-1732b0258235'],  // Historical Sites
  709:  ['photo-1572252009286-268acec5ca0a','photo-1568322445389-f64ac2515020','photo-1601625828018-98d796de1fd3'],  // Archaeological
  700:  ['photo-1554907984-15263bfd63bd','photo-1565060169194-19fabf63012c','photo-1500462918059-b1a0cb512f1d'],  // Art Museums
  701:  ['photo-1576091160550-2173dba999ef','photo-1519750157634-b6d493a0f77c','photo-1526566661780-1a67ea3c863c'],  // Interactive
  702:  ['photo-1565060169194-19fabf63012c','photo-1571997901935-c03614bf3e3b','photo-1569426489641-e1dbfeac9a28'],  // History Museums
  703:  ['photo-1518770660439-4636190af475','photo-1507413245164-6160d8298b31','photo-1581091226825-a6a2a5aee158'],  // Science
  705:  ['photo-1571988840298-3b5301d5109b','photo-1519197924294-4ba991a11128','photo-1558618666-fcd25c85cd64'],  // Castles
  706:  ['photo-1566073771259-6a8506099945','photo-1587502537104-aac10f5fb6f7','photo-1516550893923-42d28e5677af'],  // Palaces
  710:  ['photo-1548102245-c79dbbb1f8d8','photo-1611425560021-f3ac52e5a2a8','photo-1502602898657-3e91760cbb34'],  // Worship
  712:  ['photo-1501854140801-50d01698950b','photo-1426604966848-d7adac402bff','photo-1560193898-70a85e6a47db'],  // Theme Parks
  723:  ['photo-1474511320723-9a56873867b5','photo-1503256207526-0d5523f31059','photo-1546182990-dffeafbe841d'],  // Zoos
  725:  ['photo-1416879595882-3373a0480b5b','photo-1466781783364-36c955e42a7f','photo-1459156212016-c812468e2115'],  // Botanical
  1034: ['photo-1414235077428-338989a2e8c0','photo-1504674900247-0877df9cc836','photo-1565299624946-b28f40a0ae38'],  // Food
  1035: ['photo-1559494007-9f5847c49d94','photo-1473448912268-2022ce9509d8','photo-1548574505-5e239809ee19'],  // Cruises
  1040: ['photo-1569949381669-ecf31ae8e613','photo-1499856871958-5b9627545d1a','photo-1476514525535-07fb3b4ae5f1'],  // City Tours
  1042: ['photo-1488085061387-422e29b40080','photo-1506973035872-a4ec16b8e8d9','photo-1464822759023-fed622ff2c3b'],  // Day Trips
  2596: ['photo-1503095396549-807759245b35','photo-1540575467063-178a50c2df87','photo-1516450360452-9312f5e86fc7'],  // Shows
  1033: ['photo-1556909114-f6e7ad7d3136','photo-1498837167922-ddd27525d352','photo-1507048331197-7d4ac70811cf'],  // Workshops
  1840: ['photo-1436491865332-7a61a109cc05','photo-1544620347-c4fd4a3d5957','photo-1556742049-0cfed4f6a45d'],  // Transfers
};
const DEFAULT_FALLBACKS = [
  'photo-1488085061387-422e29b40080','photo-1476514525535-07fb3b4ae5f1','photo-1469854523086-cc02fe5d8800',
];
function getTagFallback(tag_ids: number[] | undefined, productId: number | string): string {
  const id = Number(productId);
  if (tag_ids && tag_ids.length > 0) {
    for (const tid of tag_ids) {
      const photos = TAG_FALLBACKS[tid];
      if (photos) return photos[id % photos.length];
    }
  }
  return DEFAULT_FALLBACKS[id % DEFAULT_FALLBACKS.length];
}

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
  const tagFallback = `https://images.unsplash.com/${getTagFallback(product.tag_ids, product.id)}?w=560&h=420&fit=crop`;
  const cityFallback = `https://images.unsplash.com/${fallbackPhoto}?w=560&h=420&fit=crop`;
  const initialImg = product.images?.[0] || tagFallback;
  const [imgSrc, setImgSrc] = useState<string>(initialImg);
  const scrapedRef = useRef(false);

  // 이미지 없을 때 백그라운드 스크래핑
  useEffect(() => {
    if (product.images?.[0]) {
      setImgSrc(product.images[0]);
      return;
    }
    if (scrapedRef.current || !product.product_url) return;
    scrapedRef.current = true;
    fetch(`/api/tiqets/product-image?product_url=${encodeURIComponent(product.product_url)}`)
      .then(r => r.json())
      .then(d => { if (d.imageUrl) setImgSrc(d.imageUrl); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.images, product.product_url]);

  const avg = product.ratings?.average ?? 0;
  const price = Math.floor(product.price || 0);

  return (
    <Link
      href={`/attractions/${citySlug}/${product.id}`}
      className="group flex-shrink-0 w-[260px] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
          onError={() => setImgSrc(cityFallback)}
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
}: {
  product: TiqetsProduct;
  citySlug: string;
}) {
  const tagFallback = `https://images.unsplash.com/${getTagFallback(product.tag_ids, product.id)}?w=560&h=420&fit=crop`;
  const placeholder = getTagPlaceholder(product.tag_ids);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // 서버에서 이미 스크래핑된 이미지 있으면 바로 사용
    if (product.images && product.images.length > 0) {
      setImageUrl(product.images[0]);
      setImgLoading(false);
      return;
    }
    // 없으면 태그 기반 Unsplash 폴백 즉시 표시 + 백그라운드 스크래핑
    setImageUrl(tagFallback);
    setImgLoading(false);
    if (product.product_url) {
      fetch(`/api/tiqets/product-image?product_url=${encodeURIComponent(product.product_url)}`)
        .then(r => r.json())
        .then(d => { if (d.imageUrl) setImageUrl(d.imageUrl); })
        .catch(() => {});
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
        ) : !imgErr && imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
            onError={() => setImgErr(true)}
          />
        ) : (
          /* 이미지 없거나 로드 실패 → 카테고리 그라데이션 플레이스홀더 */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-300"
            style={{ background: placeholder.bg }}
          >
            <span className="text-3xl opacity-80">{placeholder.icon}</span>
          </div>
        )}
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
          {(() => {
            // Tiqets URL에서 product ID 추출 → 내부 상세 페이지 연결
            const pid = attraction.tiqetsUrl?.match(/-p(\d+)\/?/)?.[1];
            const internalUrl = pid
              ? `/attractions/${attraction.city}/${pid}`
              : `/attractions/${attraction.city}`;
            return (
              <a
                href={internalUrl}
                className="px-3 py-1.5 rounded-lg bg-[#2B7FFF] text-white text-[12px] font-semibold hover:bg-[#1D6AE5] transition-colors whitespace-nowrap"
              >
                View Details
              </a>
            );
          })()}
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
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [catHovered, setCatHovered] = useState(false);
  const top10ScrollRef = useRef<HTMLDivElement>(null);
  const [top10Hovered, setTop10Hovered] = useState(false);

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
  const [loadingMore, setLoadingMore] = useState(false); // 백그라운드 전체 로딩 중 표시

  const fetchProducts = useCallback(async () => {
    if (!cityInfo) return;
    setLoading(true);

    const apiBase = `/api/tiqets/city-with-images?city_id=${cityInfo.id}`;

    try {
      const res = await fetch(apiBase);
      const data = await res.json();
      const prods = data.products || [];
      setProducts(prods);
      if (prods.length === 0) {
        const normalizedSlug = citySlug.replace(/-/g, ' ');
        setDbAttractions(getAttractionsByCity(normalizedSlug));
      } else {
        setDbAttractions([]);
      }
    } catch {
      setProducts([]);
      const normalizedSlug = citySlug.replace(/-/g, ' ');
      setDbAttractions(getAttractionsByCity(normalizedSlug));
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  /* ─── Top 10 (인기순: 리뷰 수 기준) ──────── */
  const top10 = [...products]
    .filter(p => (p.ratings?.total || 0) > 0)
    .sort((a, b) => (b.ratings?.total || 0) - (a.ratings?.total || 0))
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

      {/* ─── 로딩 진행바 ──────────────────────────────────── */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[200] h-[3px] bg-[#E0E7EF] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2B7FFF] via-[#7C3AED] to-[#2B7FFF] bg-[length:200%_100%]"
            style={{ animation: 'loadingBar 1.4s ease-in-out infinite' }}
          />
          <style>{`
            @keyframes loadingBar {
              0%   { background-position: 200% 0; width: 30%; }
              50%  { background-position: 0% 0;   width: 80%; }
              100% { background-position: -200% 0; width: 100%; }
            }
          `}</style>
        </div>
      )}

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
          <div ref={searchRef} className="relative w-full max-w-[560px]">
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
                className="flex-shrink-0 m-1 sm:m-1.5 px-3 sm:px-5 py-2.5 rounded-lg bg-[#2B7FFF] hover:bg-[#1D6AE5] text-white font-semibold transition-colors"
              >
                <svg className="sm:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <span className="hidden sm:inline text-[14px]">Search</span>
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
            <div
              className="relative"
              onMouseEnter={() => setTop10Hovered(true)}
              onMouseLeave={() => setTop10Hovered(false)}
            >
              <button
                onClick={() => top10ScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E5E7EB] shadow-lg flex items-center justify-center text-[#374151] hover:bg-[#F1F5F9] transition-opacity ${top10Hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                tabIndex={-1} aria-label="Scroll left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div ref={top10ScrollRef} className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
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
              <button
                onClick={() => top10ScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E5E7EB] shadow-lg flex items-center justify-center text-[#374151] hover:bg-[#F1F5F9] transition-opacity ${top10Hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                tabIndex={-1} aria-label="Scroll right"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
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
          <div
            className="relative"
            onMouseEnter={() => setCatHovered(true)}
            onMouseLeave={() => setCatHovered(false)}
          >
            <button
              onClick={() => catScrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E5E7EB] shadow-lg flex items-center justify-center text-[#374151] hover:bg-[#F1F5F9] transition-opacity ${catHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              tabIndex={-1} aria-label="Scroll left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div ref={catScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
              {[{ id: '', label: 'All', icon: '✨' }, ...(CITY_CATEGORIES[citySlug] || [])].map(cat => (
                <button
                  key={cat.id || 'all'}
                  onClick={() => { setActiveCategory(cat.id); setDisplayCount(24); }}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold border transition-all ${
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
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold border border-dashed border-[#CBD5E1] text-[#64748B] hover:border-[#0F172A] hover:text-[#0F172A] transition-all bg-white"
              >
                More categories ↓
              </button>
            </div>
            <button
              onClick={() => catScrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E5E7EB] shadow-lg flex items-center justify-center text-[#374151] hover:bg-[#F1F5F9] transition-opacity ${catHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              tabIndex={-1} aria-label="Scroll right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 4. SORT BAR ───────────────────────────────────── */}
      <div ref={resultsRef} className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-extrabold text-[#0F172A]">
                All experiences in {cityInfo.name}
              </h2>
              <span className="text-[13px] text-[#64748B]">
                {loading ? 'Loading…' : `${sorted.length} experiences found`}
              </span>
              {loadingMore && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
                  <span className="w-3 h-3 rounded-full border-2 border-[#94A3B8] border-t-transparent animate-spin inline-block" />
                  Loading more…
                </span>
              )}
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
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-5 h-5 rounded-full border-[2.5px] border-[#2B7FFF] border-t-transparent animate-spin" />
              <p className="text-[14px] font-semibold text-[#64748B]">
                Loading experiences in {cityInfo.name}…
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        ) : sorted.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayed.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  citySlug={citySlug}
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
