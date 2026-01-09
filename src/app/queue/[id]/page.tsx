"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Clock, AlertCircle, CheckCircle, Smartphone, MapPin, Bell } from 'lucide-react';

export default function QueuePatientPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('waiting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('Patient');

  const fetchPatientData = useCallback(async () => {
    if (!patientId) return;

    try {
      // Récupérer la position du patient dans la file
      const { data: queueData, error: queueError } = await supabase
        .from('queue')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (queueError && queueError.code !== 'PGRST116') {
        throw queueError;
      }

      if (queueData) {
        setQueuePosition(queueData.position);
        setEstimatedWaitTime(queueData.estimated_wait_time);
        setStatus('waiting');
      } else {
        // Si pas dans la file, vérifier s'il a été traité
        const { data: patientData } = await supabase
          .from('patients')
          .select('status')
          .eq('id', patientId)
          .single();
        
        if (patientData) {
          setStatus(patientData.status);
        }
      }

      // Récupérer le nom du patient
      const { data: patientData } = await supabase
        .from('patients')
        .select('name')
        .eq('id', patientId)
        .single();
      
      if (patientData) {
        setPatientName(patientData.name);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la connexion au système.";
      console.error("Erreur:", errorMessage);
      setError("Erreur lors de la connexion au système.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();

      // Abonnement temps réel pour les changements dans la table queue
      const subscription = supabase
        .channel(`public:patient-queue:${patientId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'queue',
            filter: `patient_id=eq.${patientId}`
          },
          (payload) => {
            console.log('Changement détecté dans la file:', payload);
            fetchPatientData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [patientId, fetchPatientData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-blue-800 font-medium text-lg">Connexion à SmartQueue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-red-800 font-medium text-lg text-center">{error}</p>
      </div>
    );
  }

  if (status === 'completed' || status === 'cancelled') {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-800 mb-2">Merci {patientName} !</h1>
          <p className="text-green-700 text-lg">Votre passage est terminé.</p>
          <p className="text-sm text-green-600 mt-2">Au plaisir de vous revoir.</p>
        </div>
      </div>
    );
  }

  if (status === 'called' || (queuePosition !== null && queuePosition === 1)) {
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-4 text-center animate-pulse-slow">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="bg-yellow-100 p-6 rounded-full mb-4 inline-flex">
            <Bell className="w-20 h-20 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-yellow-800 mb-2">C&apos;est votre tour !</h1>
          <p className="text-yellow-700 text-xl mb-2">Merci de vous présenter au cabinet.</p>
          <p className="text-yellow-600 text-sm">Le médecin vous attend.</p>
          <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
            <p className="text-yellow-800 font-medium">Direction : Cabinet Médical</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la position dans la file
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-white text-2xl font-bold mb-1">SmartQueue</h1>
          <p className="text-blue-100 text-sm">Maroc</p>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Smartphone className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm">Bienvenue, {patientName}</p>
          </div>
          
          <div className="w-full space-y-4">
            {/* Position */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
              <p className="text-blue-800 text-sm font-medium uppercase tracking-wider mb-2">Votre Position</p>
              <div className="flex justify-center items-baseline">
                <span className="text-6xl font-bold text-blue-600">{queuePosition || '-'}</span>
                {queuePosition && (
                  <span className="text-blue-400 text-xl ml-2">/ {queuePosition}</span>
                )}
              </div>
            </div>

            {/* Temps d'attente */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-500 mr-3" />
                <p className="text-gray-600 font-medium">Temps d&apos;attente estimé</p>
              </div>
              <p className="text-gray-800 font-bold text-lg">
                {estimatedWaitTime ? `${estimatedWaitTime} min` : '< 5 min'}
              </p>
            </div>

            {/* Message d'attente */}
            <div className="bg-white p-4 rounded-xl text-center border border-gray-200">
              <p className="text-gray-500 text-sm mb-3">Prochaine personne dans</p>
              <div className="flex justify-center space-x-2">
                <div className="h-3 w-3 bg-blue-200 rounded-full animate-bounce"></div>
                <div className="h-3 w-3 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="h-3 w-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Gardez cette page ouverte</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <MapPin className="w-3 h-3 mr-1" /> Cabinet Médical SmartQueue
          </p>
        </div>
      </div>
    </div>
  );
}
