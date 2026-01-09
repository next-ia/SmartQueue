"use client";

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const isSupabaseError = error.message?.includes('supabase') || 
                          error.message?.includes('network') ||
                          error.message?.includes('fetch');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="bg-red-100 p-4 rounded-full inline-flex mb-4">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Une erreur est survenue</h2>
        
        {isSupabaseError ? (
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Problème de connexion à la base de données</p>
            <p className="text-sm text-gray-500">
              Veuillez vérifier votre connexion internet et réessayer.
            </p>
          </div>
        ) : (
          <p className="text-gray-600 mb-6">
            Une erreur inattendue s'est produite. Veuillez réessayer.
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Réessayer
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            <Home className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">
            Code d'erreur: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
