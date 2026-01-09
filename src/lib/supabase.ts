import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vérification des variables d'environnement au démarrage
if (!supabaseUrl) {
  console.error('❌ ERREUR: NEXT_PUBLIC_SUPABASE_URL est manquante dans les variables d\'environnement!');
  console.error('📝 Veuillez ajouter NEXT_PUBLIC_SUPABASE_URL dans votre fichier .env.local');
}

if (!supabaseAnonKey) {
  console.error('❌ ERREUR: NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante dans les variables d\'environnement!');
  console.error('📝 Veuillez ajouter NEXT_PUBLIC_SUPABASE_ANON_KEY dans votre fichier .env.local');
}

if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Variables d\'environnement Supabase configurées correctement');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);