'use client';
import CategoryPage from '@/components/CategoryPage';

export default function CategoryPageClient({ slug, displayName, categoryType, categoryId }: { slug: string; displayName: string; categoryType: 'sport' | 'concert'; categoryId?: string }) {
  return <CategoryPage slug={slug} displayName={displayName} categoryType={categoryType} categoryId={categoryId} />;
}
