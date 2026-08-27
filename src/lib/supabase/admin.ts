import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin-klient til brug i baggrundsjobs (fx cron-jobs), der ikke har en
 * indlogget bruger at køre som. Bruger service role-nøglen, som ignorerer
 * RLS-regler helt - må derfor ALDRIG bruges i kode, der kører i browseren
 * eller kan kaldes direkte af en almindelig bruger.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
