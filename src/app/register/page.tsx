"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Ticket, Phone, User, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Regex pour valider les numéros marocains
  // Accepte: 06XXXXXXXX, 07XXXXXXXX, +212XXXXXXXXX
  const validatePhone = (phone: string): boolean => {
    const cleanedPhone = phone.replace(/\s/g, '');
    // Format marocain: 06/07 + 8 chiffres OU +212 + 9 chiffres
    const moroccanPhoneRegex = /^(?:\+212|0)[5-7]\d{8}$/;
    return moroccanPhoneRegex.test(cleanedPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validation du téléphone obligatoire
    if (!phone.trim()) {
      setPhoneError('Le numéro de téléphone est obligatoire pour être contacté');
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError('Numéro invalide. Utilisez: 06XXXXXXXX, 07XXXXXXXX ou +212XXXXXXXXX');
      return;
    }

    setPhoneError(null);
    setLoading(true);
    setError(null);

    try {
      // 1. Récupérer le nombre actuel de patients dans la file
      const { count } = await supabase
        .from('queue')
        .select('*', { count: 'exact', head: true });

      const nextPosition = (count || 0) + 1;
      const estimatedWaitTime = nextPosition <= 1 ? 0 : (nextPosition - 1) * 15; // 15 min par patient par défaut

      // 2. Créer le patient
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({ 
          name: name.trim(), 
          phone: phone.trim() || undefined,
          status: 'waiting'
        })
        .select()
        .single();

      if (patientError) throw patientError;
      if (!newPatient) throw new Error("Échec de la création du patient");

      // 3. Ajouter à la file d'attente
      const { error: queueError } = await supabase
        .from('queue')
        .insert({ 
          patient_id: newPatient.id, 
          position: nextPosition,
          estimated_wait_time: estimatedWaitTime
        });

      if (queueError) throw queueError;

      // 4. Rediriger vers la page personnelle
      console.log('Navigation vers /queue/' + newPatient.id);
      router.push(`/queue/${newPatient.id}`);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      console.error("Erreur:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <div className="bg-white/20 p-3 rounded-full inline-flex mb-3">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">Prendre un ticket</h1>
          <p className="text-blue-100 text-sm mt-1">Cabinet Médical SmartQueue</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Nom du Patient
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre nom"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError(null);
                }}
                placeholder="06 XX XX XX XX"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
              />
              {phoneError && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {phoneError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Traitement...
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5 mr-2" />
                  Prendre mon ticket
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Comment ça marche ?</p>
                <ul className="text-xs text-gray-500 mt-1 space-y-1">
                  <li>1. Entrez votre nom</li>
                  <li>2. Vous êtes ajouté à la file d&apos;attente</li>
                  <li>3. Suivez votre position en temps réel</li>
                  <li>4. Vous serez appelé quand ce sera votre tour</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
