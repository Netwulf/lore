'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-warm-ivory/80 hover:text-warm-ivory border border-warm-ivory/20 hover:border-warm-ivory/40 transition-colors"
    >
      Sign Out
    </button>
  );
}
