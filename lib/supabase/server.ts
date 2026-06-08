import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client de servidor (API routes / server actions) com sessão via cookies.
// Usa apenas chaves públicas; escrita sensível usa o admin client.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list: { name: string; value: string; options?: any }[]) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // chamada fora de um contexto que permite set (ex.: Server Component)
        }
      },
    },
  });
}
