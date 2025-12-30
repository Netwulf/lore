import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@lore/db';

/**
 * Singleton Supabase client instance
 * Ensures single connection across all hooks/components
 */
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // Return existing instance if available (singleton pattern)
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new instance
  supabaseInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseInstance;
}

/**
 * Reset client instance (for testing purposes)
 */
export function resetClient() {
  supabaseInstance = null;
}
