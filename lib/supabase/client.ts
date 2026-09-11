"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Singleton browser client. Recipro has no auth, so every tab talks to
 * Supabase directly with the public anon key (see supabase/schema.sql for
 * the RLS policies that constrain what that key can do).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
