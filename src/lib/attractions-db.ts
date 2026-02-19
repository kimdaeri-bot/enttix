export interface AttractionItem {
  id: string;
  name: string;
  nameKo: string;
  city: string;
  country: string;
  desc: string;
  descKo: string;
  type: 'landmark' | 'museum' | 'evening' | 'tour' | 'activity';
  isEvening: boolean;
  price: number;
  currency: string;
  tiqetsUrl: string;
  imageUrl?: string;
  bestTime?: 'morning' | 'afternoon' | 'evening' | 'any';
  duration?: string;
}

export const ATTRACTIONS_DB: AttractionItem[] = [
  // ===== LONDON =====
  {
    id: 'london-eye', name: 'London Eye', nameKo: '런던 아이', city: 'london', country: 'UK',
    desc: 'Iconic Ferris wheel with panoramic Thames views', descKo: '템스강 파노라마 야경을 즐기는 대관람차',
    type: 'evening', isEvening: true, price: 35, currency: 'GBP',
    tiqetsUrl: 'https://www.tiqets.com/en/london-c24/london-eye-p970627/',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    bestTime: 'evening', duration: '30 min',
  },
  {
    id: 'tower-of-london', name: 'Tower of London', nameKo: '런던 타워', city: 'london', country: 'UK',
    desc: 'Historic castle with Crown Jewels', descKo: '왕실 보석과 역사가 살아있는 고성',
    type: 'landmark', isEvening: false, price: 30, currency: 'GBP',
    tiqetsUrl: 'https://www.tiqets.com/en/london-c24/tower-of-london-p973143/',
    imageUrl: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800',
    bestTime: 'morning', duration: '2-3 hours',
  },
  {
    id: 'westminster-by-night', name: 'Westminster & Illuminations Tour', nameKo: '야간 웨스트민스터 투어', city: 'london', country: 'UK',
    desc: 'Night walking tour past illuminated landmarks', descKo: '조명 아름다운 웨스트민스터 야간 도보 투어',
    type: 'evening', isEvening: true, price: 25, currency: 'GBP',
    tiqetsUrl: 'https://www.tiqets.com/en/london-c24/',
    imageUrl: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
    bestTime: 'evening', duration: '2 hours',
  },
  {
    id: 'british-museum', name: 'British Museum', nameKo: '대영박물관', city: 'london', country: 'UK',
    desc: 'World-class museum with ancient artifacts', descKo: '전 세계 유물을 소장한 세계 최대 박물관',
    type: 'museum', isEvening: false, price: 0, currency: 'GBP',
    tiqetsUrl: 'https://www.tiqets.com/en/london-c24/',
    imageUrl: 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800',
    bestTime: 'morning', duration: '3 hours',
  },
  {
    id: 'sky-garden', name: 'Sky Garden', nameKo: '스카이 가든', city: 'london', country: 'UK',
    desc: 'Free sky-high garden with City of London views', descKo: '런던 시티 전망 무료 공중 정원',
    type: 'evening', isEvening: true, price: 0, currency: 'GBP',
    tiqetsUrl: 'https://www.tiqets.com/en/london-c24/',
    imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
    bestTime: 'evening', duration: '1 hour',
  },

  // ===== PARIS =====
  {
    id: 'eiffel-tower-evening', name: 'Eiffel Tower Evening Visit', nameKo: '에펠탑 야경', city: 'paris', country: 'France',
    desc: 'Iconic tower with sparkling night show', descKo: '매 시간 빛나는 에펠탑 야경, 파리 필수 코스',
    type: 'evening', isEvening: true, price: 29, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/paris-c30/eiffel-tower-p970590/',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    bestTime: 'evening', duration: '2 hours',
  },
  {
    id: 'louvre', name: 'Louvre Museum', nameKo: '루브르 박물관', city: 'paris', country: 'France',
    desc: "World's largest art museum, home to Mona Lisa", descKo: '모나리자가 있는 세계 최대 미술관',
    type: 'museum', isEvening: false, price: 22, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/paris-c30/louvre-museum-p970586/',
    imageUrl: 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800',
    bestTime: 'morning', duration: '3 hours',
  },
  {
    id: 'seine-cruise-night', name: 'Seine River Night Cruise', nameKo: '세느강 야간 유람선', city: 'paris', country: 'France',
    desc: 'Illuminated Paris landmarks from the river', descKo: '조명 가득한 야경을 배 위에서 즐기는 세느강 크루즈',
    type: 'evening', isEvening: true, price: 19, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/paris-c30/',
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
    bestTime: 'evening', duration: '1 hour',
  },
  {
    id: 'versailles', name: 'Palace of Versailles', nameKo: '베르사유 궁전', city: 'paris', country: 'France',
    desc: 'Opulent royal palace with stunning gardens', descKo: '화려한 왕실 정원과 궁전',
    type: 'landmark', isEvening: false, price: 20, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/paris-c30/palace-of-versailles-p970588/',
    imageUrl: 'https://images.unsplash.com/photo-1551410224-699683e15636?w=800',
    bestTime: 'morning', duration: 'half day',
  },

  // ===== ROME =====
  {
    id: 'colosseum', name: 'Colosseum', nameKo: '콜로세움', city: 'rome', country: 'Italy',
    desc: 'Ancient Roman gladiatorial arena', descKo: '고대 로마 검투사의 무대',
    type: 'landmark', isEvening: false, price: 18, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/rome-c12/colosseum-p970526/',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    bestTime: 'morning', duration: '2 hours',
  },
  {
    id: 'rome-night-tour', name: 'Rome by Night Walking Tour', nameKo: '로마 야간 투어', city: 'rome', country: 'Italy',
    desc: 'Trevi Fountain & Pantheon under the stars', descKo: '트레비 분수와 판테온을 별빛 아래 거니는 야간 투어',
    type: 'evening', isEvening: true, price: 28, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/rome-c12/',
    imageUrl: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
    bestTime: 'evening', duration: '2 hours',
  },
  {
    id: 'vatican', name: 'Vatican Museums & Sistine Chapel', nameKo: '바티칸 박물관 & 시스티나 성당', city: 'rome', country: 'Italy',
    desc: "Michelangelo's ceiling & art treasures", descKo: '미켈란젤로 천장화와 예술의 보고',
    type: 'museum', isEvening: false, price: 25, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/rome-c12/vatican-museums-p970527/',
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800',
    bestTime: 'morning', duration: '3 hours',
  },

  // ===== BARCELONA =====
  {
    id: 'sagrada-familia', name: 'Sagrada Família', nameKo: '사그라다 파밀리아', city: 'barcelona', country: 'Spain',
    desc: "Gaudí's unfinished masterpiece cathedral", descKo: '가우디의 미완성 걸작 대성당',
    type: 'landmark', isEvening: false, price: 26, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/barcelona-c38/sagrada-familia-p970574/',
    imageUrl: 'https://images.unsplash.com/photo-1583779457094-ab6f77f7bf57?w=800',
    bestTime: 'morning', duration: '2 hours',
  },
  {
    id: 'barcelona-night-views', name: 'Bunkers del Carmel Sunset Tour', nameKo: '번커스 델 카르멜 야경 투어', city: 'barcelona', country: 'Spain',
    desc: '360° Barcelona skyline at golden hour', descKo: '바르셀로나 전경을 360도로 즐기는 황금빛 선셋',
    type: 'evening', isEvening: true, price: 22, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/barcelona-c38/',
    imageUrl: 'https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=800',
    bestTime: 'evening', duration: '2 hours',
  },

  // ===== NEW YORK =====
  {
    id: 'empire-state', name: 'Empire State Building', nameKo: '엠파이어 스테이트 빌딩', city: 'new york', country: 'USA',
    desc: 'Iconic Art Deco skyscraper with NYC views', descKo: '뉴욕 야경의 상징, 102층 전망대',
    type: 'evening', isEvening: true, price: 44, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/new-york-c39/empire-state-building-p970558/',
    imageUrl: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800',
    bestTime: 'evening', duration: '1 hour',
  },
  {
    id: 'statue-of-liberty', name: 'Statue of Liberty & Ellis Island', nameKo: '자유의 여신상', city: 'new york', country: 'USA',
    desc: 'Symbol of freedom via ferry', descKo: '페리로 떠나는 자유의 여신상 & 이민 역사 체험',
    type: 'landmark', isEvening: false, price: 24, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/new-york-c39/',
    imageUrl: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800',
    bestTime: 'morning', duration: 'half day',
  },
  {
    id: 'nyc-night-tour', name: 'NYC Illuminated Night Bus Tour', nameKo: 'NYC 야경 버스 투어', city: 'new york', country: 'USA',
    desc: 'Manhattan landmarks glowing at night', descKo: '맨해튼 야경을 편하게 즐기는 버스 투어',
    type: 'evening', isEvening: true, price: 39, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/new-york-c39/',
    imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
    bestTime: 'evening', duration: '2 hours',
  },
  {
    id: 'met-museum', name: 'The Metropolitan Museum of Art', nameKo: '메트로폴리탄 미술관', city: 'new york', country: 'USA',
    desc: "One of the world's largest art collections", descKo: '세계 최대 규모 미술관',
    type: 'museum', isEvening: false, price: 30, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/new-york-c39/',
    imageUrl: 'https://images.unsplash.com/photo-1583010580982-5fddc4a0b13e?w=800',
    bestTime: 'afternoon', duration: '3 hours',
  },

  // ===== AMSTERDAM =====
  {
    id: 'anne-frank-house', name: 'Anne Frank House', nameKo: '안네 프랑크의 집', city: 'amsterdam', country: 'Netherlands',
    desc: 'Powerful WWII historical site', descKo: '2차 대전의 역사를 간직한 감동적인 명소',
    type: 'museum', isEvening: false, price: 16, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/amsterdam-c53/',
    imageUrl: 'https://images.unsplash.com/photo-1584010719712-b62f6a945c07?w=800',
    bestTime: 'morning', duration: '1 hour',
  },
  {
    id: 'amsterdam-canal-night', name: 'Amsterdam Evening Canal Cruise', nameKo: '암스테르담 야간 운하 크루즈', city: 'amsterdam', country: 'Netherlands',
    desc: 'Illuminated canal houses and bridges', descKo: '조명으로 빛나는 운하 가옥들을 배 위에서',
    type: 'evening', isEvening: true, price: 25, currency: 'EUR',
    tiqetsUrl: 'https://www.tiqets.com/en/amsterdam-c53/',
    imageUrl: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800',
    bestTime: 'evening', duration: '1 hour',
  },

  // ===== DUBAI =====
  {
    id: 'burj-khalifa', name: 'Burj Khalifa At The Top', nameKo: '부르즈 할리파 전망대', city: 'dubai', country: 'UAE',
    desc: "World's tallest building, stunning night views", descKo: '세계 최고층 빌딩 전망대, 두바이 야경의 절정',
    type: 'evening', isEvening: true, price: 45, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/dubai-c86/',
    imageUrl: 'https://images.unsplash.com/photo-1546412414-e1885259563a?w=800',
    bestTime: 'evening', duration: '1-2 hours',
  },
  {
    id: 'dubai-desert-safari', name: 'Dubai Desert Safari at Sunset', nameKo: '두바이 사막 일몰 사파리', city: 'dubai', country: 'UAE',
    desc: 'Dune bashing, camel ride & BBQ dinner', descKo: '듄 배싱, 낙타 타기, BBQ 저녁식사',
    type: 'evening', isEvening: true, price: 55, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/dubai-c86/',
    imageUrl: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800',
    bestTime: 'evening', duration: '6 hours',
  },

  // ===== TOKYO =====
  {
    id: 'tokyo-skytree', name: 'Tokyo Skytree Night View', nameKo: '도쿄 스카이트리 야경', city: 'tokyo', country: 'Japan',
    desc: "Japan's tallest tower with night cityscape", descKo: '도쿄 야경을 한눈에 담는 일본 최고 전망대',
    type: 'evening', isEvening: true, price: 22, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/tokyo-c77/',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    bestTime: 'evening', duration: '1 hour',
  },
  {
    id: 'teamlab', name: 'teamLab Borderless', nameKo: '팀랩 보더리스', city: 'tokyo', country: 'Japan',
    desc: 'Immersive digital art experience', descKo: '몰입형 디지털 아트 세계',
    type: 'activity', isEvening: true, price: 30, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/tokyo-c77/',
    imageUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800',
    bestTime: 'evening', duration: '2 hours',
  },

  // ===== SINGAPORE =====
  {
    id: 'gardens-by-the-bay', name: 'Gardens by the Bay Light Show', nameKo: '가든스 바이 더 베이 야간 쇼', city: 'singapore', country: 'Singapore',
    desc: 'Spectacular nightly Supertree light show', descKo: '슈퍼트리에서 펼쳐지는 환상적인 야간 빛의 쇼',
    type: 'evening', isEvening: true, price: 20, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/singapore-c78/',
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    bestTime: 'evening', duration: '2 hours',
  },

  // ===== HONG KONG =====
  {
    id: 'peak-tram-night', name: 'The Peak Tram & Night View', nameKo: '피크 트램 야경', city: 'hong kong', country: 'HK',
    desc: 'Hong Kong skyline from Victoria Peak', descKo: '빅토리아 피크에서 홍콩 스카이라인 야경',
    type: 'evening', isEvening: true, price: 18, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/hong-kong-c71/',
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
    bestTime: 'evening', duration: '2 hours',
  },

  // ===== ISTANBUL =====
  {
    id: 'bosphorus-cruise-night', name: 'Bosphorus Night Cruise', nameKo: '보스포루스 야간 크루즈', city: 'istanbul', country: 'Turkey',
    desc: 'Two continents lit up at night from the water', descKo: '유럽과 아시아 두 대륙의 야경을 배 위에서',
    type: 'evening', isEvening: true, price: 30, currency: 'USD',
    tiqetsUrl: 'https://www.tiqets.com/en/istanbul-c72/',
    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800',
    bestTime: 'evening', duration: '2 hours',
  },
];

// 도시 이름 정규화
export function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/뉴욕/g, 'new york')
    .replace(/런던/g, 'london')
    .replace(/파리/g, 'paris')
    .replace(/로마/g, 'rome')
    .replace(/바르셀로나/g, 'barcelona')
    .replace(/암스테르담/g, 'amsterdam')
    .replace(/두바이/g, 'dubai')
    .replace(/도쿄/g, 'tokyo')
    .replace(/싱가포르/g, 'singapore')
    .replace(/홍콩/g, 'hong kong')
    .replace(/이스탄불/g, 'istanbul');
}

// 도시의 어트랙션 조회
export function getAttractionsByCity(city: string): AttractionItem[] {
  const normalized = normalizeCity(city);
  return ATTRACTIONS_DB.filter(a => a.city === normalized);
}

// 도시의 야경/저녁 어트랙션만
export function getEveningAttractions(city: string): AttractionItem[] {
  return getAttractionsByCity(city).filter(a => a.isEvening);
}

// 이름으로 매칭
export function matchAttraction(name: string, city: string): AttractionItem | null {
  const cityAttractions = getAttractionsByCity(city);
  const lower = name.toLowerCase();
  return (
    cityAttractions.find(
      a =>
        a.name.toLowerCase().includes(lower) ||
        lower.includes(a.name.toLowerCase().split(' ')[0]) ||
        a.nameKo.includes(name),
    ) || null
  );
}
