"use client";

import { useOptimistic, useTransition } from "react";
import { callNextPatient, completePatient, cancelPatient } from "@/app/actions";
import { Zap, Check, X, ChevronRight } from "lucide-react";

type QueueEntry = {
  id: string;
  position: number;
  patient_id: string;
  estimated_wait_time: number;
};

type Patient = {
  id: string;
  name: string;
  phone?: string;
  status: string;
};

type QueueControllerProps = {
  queue: QueueEntry[];
  patients: Patient[];
};

export function QueueController({ queue, patients }: QueueControllerProps) {
  const [isPending, startTransition] = useTransition();
  
  // État optimiste pour le patient actuel (premier de la file)
  const currentEntry = queue[0];
  const currentPatient = currentEntry 
    ? patients.find(p => p.id === currentEntry.patient_id) 
    : null;
  
  const [optimisticCalled, setOptimisticCalled] = useOptimistic(
    currentEntry?.estimated_wait_time ?? -1,
    (state, newValue: number) => newValue
  );

  const handleCallNext = async () => {
    if (!currentEntry) return;

    const newWaitTime = 0;

    startTransition(async () => {
      // Mise à jour optimiste immédiate
      setOptimisticCalled(newWaitTime);
      console.log('Optimistic: Patient appelé, estimated_wait_time = 0');

      try {
        // Appel serveur réel
        await callNextPatient(currentEntry.id);
        console.log('Server Action: Patient appelé avec succès');
      } catch (error) {
        console.error("Échec de l'appel:", error);
        // En cas d'erreur, React reviendra automatiquement à la valeur réelle
        setOptimisticCalled(currentEntry.estimated_wait_time);
      }
    });
  };

  const handleComplete = async () => {
    if (!currentEntry || !currentPatient) return;

    startTransition(async () => {
      console.log('Optimistic: Patient terminé, suppression de la file');

      try {
        await completePatient(currentEntry.id, currentPatient.id);
        console.log('Server Action: Patient terminé avec succès');
      } catch (error) {
        console.error("Échec de la complétion:", error);
      }
    });
  };

  const handleCancel = async () => {
    if (!currentEntry || !currentPatient) return;

    startTransition(async () => {
      console.log('Optimistic: Patient annulé, suppression de la file');

      try {
        await cancelPatient(currentEntry.id, currentPatient.id);
        console.log('Server Action: Patient annulé avec succès');
      } catch (error) {
        console.error("Échec de l'annulation:", error);
      }
    });
  };

  const isCalled = optimisticCalled === 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Patient Actuel */}
      <div className="text-center">
        <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">
          {isCalled ? "Patient Actuel" : "Prochain Patient"}
        </p>
        <div className={`text-8xl font-black transition-all ${
          isPending 
            ? "text-blue-500 scale-95" 
            : isCalled 
              ? "text-green-600" 
              : "text-slate-900"
        }`}>
          #{currentEntry?.position ?? "-"}
        </div>
        <p className={`text-xl font-medium mt-2 ${isCalled ? "text-green-700" : "text-slate-600"}`}>
          {currentPatient?.name ?? "En attente..."}
        </p>
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-wrap justify-center gap-3">
        {isCalled ? (
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="group flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>TERMINER</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleCallNext}
            disabled={isPending || !currentEntry}
            className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>APPELER LE SUIVANT</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        )}

        {/* Bouton Annuler */}
        {currentEntry && (
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            {isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-700" />
            ) : (
              <>
                <X className="w-5 h-5" />
                <span>ANNULER</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Indicateur de chargement global */}
      {isPending && (
        <p className="text-sm text-blue-600 animate-pulse">Mise à jour en cours...</p>
      )}
    </div>
  );
}
