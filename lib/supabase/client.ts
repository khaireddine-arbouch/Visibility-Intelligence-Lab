/**
 * Supabase Client for Client Components
 * Based on: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

