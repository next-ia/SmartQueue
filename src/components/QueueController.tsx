"use client";

import { useOptimistic, useTransition } from "react";
import { callNextPatient } from "@/app/actions";
import { Zap, ChevronRight } from "lucide-react";

type QueueEntry = {
  id: string;
  position: number;
  patient_id: string;
  estimated_wait_time: number;
};

type Patient = {
  id: string;
  name: string;
};

type QueueControllerProps = {
  queue: QueueEntry[];
  patients: Patient[];
};

export default function QueueController({ queue, patients }: QueueControllerProps) {
  const [isPending, startTransition] = useTransition();
  
  // Patient actuel (premier de la file)
  const currentEntry = queue[0];
  const currentPatient = currentEntry 
    ? patients.find(p => p.id === currentEntry.patient_id) 
    : null;
  
  // État optimiste : 0 = appelé, sinon position
  const [optimisticState, setOptimisticState] = useOptimistic(
    currentEntry?.estimated_wait_time ?? -1,
    (state, newValue: number) => newValue
  );

  const handleNext = () => {
    if (!currentEntry) return;
    
    const nextVal = 0; // 0 signifie "appelé"
    
    startTransition(async () => {
      // Mise à jour immédiate de l'UI
      setOptimisticState(nextVal);
      console.log('Optimistic: Patient appelé');
      
      // Appel serveur
      await callNextPatient(currentEntry.id);
    });
  };

  const isCalled = optimisticState === 0;
  const displayNumber = currentEntry?.position ?? "-";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">
          {isCalled ? "Patient Actuel" : "Prochain"}
        </p>
        <div className={`text-7xl font-black transition-all ${
          isPending ? "text-blue-500 scale-95" : isCalled ? "text-green-600" : "text-slate-900"
        }`}>
          #{displayNumber}
        </div>
        <p className="text-lg font-medium text-slate-600 mt-1">
          {currentPatient?.name ?? "En attente..."}
        </p>
      </div>

      <button
        onClick={handleNext}
        disabled={isPending || !currentEntry}
        className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
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
    </div>
  );
}
