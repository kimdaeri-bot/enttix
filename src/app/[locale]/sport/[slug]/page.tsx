import CategoryPageClient from './CategoryPageClient';

// slug → { displayName, tixstockCategoryId }
const sportCategories: Record<string, { name: string; categoryId?: string }> = {
  football:           { name: 'English Premier League', categoryId: '01fwnnt2cym91ttfxzt9tk1w6c' },
  tennis:             { name: 'Tennis Others' },
  golf:               { name: 'Golf' },
  rugby:              { name: 'Rugby' },
  cricket:            { name: 'Cricket' },
  'formula-1':        { name: 'Formula 1' },
  motogp:             { name: 'Moto GP' },
  boxing:             { name: 'Boxing' },
  ufc:                { name: 'UFC' },
  darts:              { name: 'Darts' },
  'ice-hockey':       { name: 'Ice Hockey' },
  basketball:         { name: 'NBA' },
  baseball:           { name: 'MLB' },
  'american-football':{ name: 'NFL' },
  'winter-games':     { name: 'Winter Games' },
  athletics:          { name: 'Athletics' },
  cycling:            { name: 'Cycling' },
  'fifa-world-cup':   { name: 'FIFA World Cup' },
};

export function generateStaticParams() {
  return Object.keys(sportCategories).map(slug => ({ slug }));
}

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = sportCategories[slug];
  const displayName = cat?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const categoryId = cat?.categoryId;
  return <CategoryPageClient slug={slug} displayName={displayName} categoryType="sport" categoryId={categoryId} />;
}
