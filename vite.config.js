import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Domaine de production fourni par Vercel au build (ex : "indie-plannings.vercel.app").
    // Sert à donner au staff le lien PUBLIC, jamais l'adresse d'un déploiement précis
    // ("indie-plannings-xxxx-oceane3.vercel.app"), qui est protégée par une connexion Vercel.
    __DOMAINE_PRODUCTION__: JSON.stringify(process.env.VERCEL_PROJECT_PRODUCTION_URL || ""),
  },
});
