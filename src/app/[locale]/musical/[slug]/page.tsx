import MusicalListClient from './MusicalListClient';

const musicalCategories: Record<string, { displayName: string; eventType: number | null }> = {
  'west-end':     { displayName: 'West End',     eventType: null }, // 전체
  'broadway':     { displayName: 'Broadway',     eventType: 1    }, // LTD는 West End 중심이라 뮤지컬(1)
  'opera':        { displayName: '오페라',        eventType: 4    },
  'ballet':       { displayName: '발레',          eventType: 5    },
  'comedy':       { displayName: '코미디',        eventType: 2    }, // 연극(2) 중 코미디
  'drama':        { displayName: '드라마/연극',   eventType: 2    },
  'family-shows': { displayName: 'Family Shows', eventType: 1    }, // 뮤지컬 계열
  'dance':        { displayName: '댄스',          eventType: 3    },
  'circus':       { displayName: '서커스',        eventType: 6    },
  'magic-shows':  { displayName: '매직쇼',        eventType: null }, // LTD에 없을 수 있어 전체
};

export function generateStaticParams() {
  return Object.keys(musicalCategories).map(slug => ({ slug }));
}

export default async function MusicalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = musicalCategories[slug];
  const displayName = cat?.displayName
    ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const eventType = cat?.eventType ?? null;

  return <MusicalListClient slug={slug} displayName={displayName} eventType={eventType} />;
}
