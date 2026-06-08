import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin client com SERVICE ROLE. SOMENTE no servidor (o import "server-only"
// quebra o build se algum componente client tentar importar). Nunca expõe a
// chave ao bundle do browser. Retorna null se não configurado.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseAdminConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
