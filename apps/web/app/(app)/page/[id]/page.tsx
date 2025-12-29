import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PageEditor from '@/components/editor/PageEditor';
import type { PartialBlock } from '@blocknote/core';
import type { Page } from '@lore/db';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PageView({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch the page
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !page) {
    notFound();
  }

  // Cast to proper type
  const typedPage = page as Page;

  // Parse content safely
  const initialContent = typedPage.content as unknown as PartialBlock[] | null;

  return (
    <PageEditor
      pageId={typedPage.id}
      initialContent={initialContent || undefined}
      initialTitle={typedPage.title}
    />
  );
}
