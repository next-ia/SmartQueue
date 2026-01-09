'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QueueEntry } from '@/types';

interface QueueDisplayProps {
  patientId?: string;
}

export default function QueueDisplay({ patientId }: QueueDisplayProps) {
  const [position, setPosition] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentPosition = async () => {
      try {
        const { data, error } = await supabase
          .from('queue_entries')
          .select('position')
          .eq('patient_id', patientId)
          .eq('status', 'waiting')
          .single();

        if (error) {
          console.error('Erreur lors de la récupération de la position:', error);
          setError('Impossible de récupérer la position');
        } else if (data) {
          setPosition(data.position);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchCurrentPosition();
    }
  }, [patientId]);

  useEffect(() => {
    const channel = supabase
      .channel('room1')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queue_entries',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const updatedEntry = payload.new as QueueEntry;
          setPosition(updatedEntry.position);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  if (position === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-500">Aucune file d&apos;attente active</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Votre position dans la file d&apos;attente
      </h2>
      <div className="text-9xl font-bold text-indigo-600 font-mono tracking-tighter">
        {position}
      </div>
      <p className="mt-4 text-gray-600">
        {position === 1
          ? "Vous êtes le prochain patient!"
          : `Il y a ${position - 1} patient(s) avant vous`}
      </p>
    </div>
  );
}
