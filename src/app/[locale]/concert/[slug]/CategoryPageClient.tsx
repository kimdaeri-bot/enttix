'use client';
import CategoryPage from '@/components/CategoryPage';

export default function CategoryPageClient({ slug, displayName, categoryType }: { slug: string; displayName: string; categoryType: 'sport' | 'concert' }) {
  return <CategoryPage slug={slug} displayName={displayName} categoryType={categoryType} />;
}
