import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  '';

function assertConfig() {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL is not configured');
  }
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase service key is not configured');
  }
}

export function createServerClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createServerClient can only be used on the server');
  }

  assertConfig();

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getServerSession(): Promise<Session> {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to read Supabase session: ${error.message}`);
  }

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
