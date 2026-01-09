"use client";

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Clock, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

function VuePatientContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id');

  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(null);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [status, setStatus] = useState<string>('waiting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('Patient');

  const fetchPatientData = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    try {
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
        const { data: patientData } = await supabase
          .from('patients')
          .select('status')
          .eq('id', patientId)
          .single();
        if (patientData) {
          setStatus(patientData.status);
        }
      }

      if (queueData) {
        const { count } = await supabase
          .from('queue')
          .select('*', { count: 'exact', head: true })
          .lt('position', queueData.position);
        setQueueCount(count || 0);
      }

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
    if (!patientId) {
      setLoading(false);
      return;
    }

    fetchPatientData();
    
    const subscription = supabase
      .channel(`public:patient:${patientId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'queue',
        filter: `patient_id=eq.${patientId}` 
      }, () => {
        fetchPatientData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [patientId, fetchPatientData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-blue-800 font-medium">Connexion à SmartQueue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-800 font-medium text-center">{error}</p>
      </div>
    );
  }

  if (status === 'completed' || status === 'cancelled') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-green-800 mb-2">Merci {patientName} !</h1>
        <p className="text-green-700">Votre passage est terminé.</p>
        <p className="text-sm text-green-600 mt-2">Au plaisir de vous revoir.</p>
      </div>
    );
  }

  if (status === 'called') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-4 text-center animate-pulse">
        <div className="bg-yellow-100 p-6 rounded-full mb-4">
          <Smartphone className="w-16 h-16 text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold text-yellow-800 mb-2">C&apos;est votre tour !</h1>
        <p className="text-yellow-700 text-lg">Merci de vous présenter au cabinet.</p>
        <p className="text-sm text-yellow-600 mt-2">Le médecin vous attend.</p>
      </div>
    );
  }

  const qrValue = patientId ? `https://smartqueue-maroc.com/patient?id=${patientId}` : 'https://smartqueue-maroc.com/';

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-white text-2xl font-bold mb-1">SmartQueue</h1>
          <p className="text-blue-100 text-sm">Maroc</p>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="mb-6 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            <QRCodeSVG value={qrValue} size={150} level={"H"} includeMargin={true} />
          </div>
          
          <div className="w-full space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
              <p className="text-blue-800 text-sm font-medium uppercase tracking-wider mb-1">Votre Position</p>
              <div className="flex justify-center items-baseline">
                <span className="text-5xl font-bold text-blue-600">{queuePosition || '-'}</span>
                <span className="text-blue-400 text-xl ml-1">/ {queueCount + (queuePosition || 0)}</span>
              </div>
            </div>

            {queuePosition === 1 ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-center flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 mr-2" />
                <p className="text-yellow-800 font-medium">C&apos;est presque votre tour !</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-500 mr-2" />
                  <p className="text-gray-600">Temps d&apos;attente estimé</p>
                </div>
                <p className="text-gray-800 font-bold">{estimatedWaitTime ? `${estimatedWaitTime} min` : '< 5 min'}</p>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-gray-500 text-sm mb-3">Prochaine personne dans</p>
              <div className="flex justify-center space-x-2">
                <div className="h-2 w-2 bg-blue-200 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Gardez cette page ouverte</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center justify-center">
            <MapPin className="w-3 h-3 mr-1" /> Cabinet Médical SmartQueue
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-blue-800 font-medium">Chargement...</p>
    </div>
  );
}

export default function VuePatientPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VuePatientContent />
    </Suspense>
  );
}
