import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Default content for "Getting Started" page
const gettingStartedContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Welcome to Lore' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Your AI-first knowledge workspace. Here are some tips to get started:',
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Press ' },
                { type: 'text', marks: [{ type: 'code' }], text: '⌘K' },
                { type: 'text', text: ' to open the command palette' },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Press ' },
                { type: 'text', marks: [{ type: 'code' }], text: '⌘N' },
                { type: 'text', text: ' to create a new page' },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Type ' },
                { type: 'text', marks: [{ type: 'code' }], text: '[[' },
                { type: 'text', text: ' to link to other pages' },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Use the ' },
                { type: 'text', marks: [{ type: 'bold' }], text: 'AI Chat' },
                { type: 'text', text: ' to ask questions about your notes' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Try to get the last visited page from localStorage (client-side)
  // First, try to get the most recently updated page
  const { data: lastPage } = await supabase
    .from('pages')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (lastPage) {
    redirect(`/page/${lastPage.id}`);
  }

  // No pages exist - create "Getting Started" page
  const { data: newPage, error } = await supabase
    .from('pages')
    .insert({
      title: 'Getting Started',
      content: gettingStartedContent,
      user_id: user.id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating Getting Started page:', error);
    // Fallback: show welcome message
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <h2 className="font-display text-3xl font-bold text-warm-ivory mb-4">
            Welcome to Lore
          </h2>
          <p className="text-warm-ivory/60 mb-8">
            Your AI-first knowledge workspace. Click the + button in the sidebar to create your first page.
          </p>
        </div>
      </div>
    );
  }

  if (newPage) {
    redirect(`/page/${newPage.id}`);
  }

  // Fallback (should never reach here)
  return null;
}
