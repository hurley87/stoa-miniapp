import { createClient as createSupabaseClient } from '@supabase/supabase-js';

type SupabaseClient = ReturnType<typeof createSupabaseClient>;

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }
  cachedClient = createSupabaseClient(url, serviceKey);
  return cachedClient;
}
