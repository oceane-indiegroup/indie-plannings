import { createClient } from "@supabase/supabase-js";

// Ces deux valeurs viennent de ton projet Supabase (Settings → API).
// En local : fichier .env  |  En production : variables d'environnement Vercel.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Message clair si les clés ne sont pas configurées.
  console.error(
    "Configuration Supabase manquante : définissez VITE_SUPABASE_URL et " +
      "VITE_SUPABASE_ANON_KEY (fichier .env en local, variables d'environnement en production)."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
