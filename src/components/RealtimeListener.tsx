"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type RealtimeListenerProps = {
  patientId: string;
};

export default function RealtimeListener({ patientId }: RealtimeListenerProps) {
  const router = useRouter();

  useEffect(() => {
    console.log('RealtimeListener: Abonnement pour le patient', patientId);

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
          console.log('RealtimeListener: Changement détecté pour le patient', payload);
          // Rafraîchir la page pour synchroniser l'état
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      console.log('RealtimeListener: Désabonnement');
      supabase.removeChannel(subscription);
    };
  }, [patientId, router]);

  return null; // Ce composant est invisible, il seulement écoute les changements
}
