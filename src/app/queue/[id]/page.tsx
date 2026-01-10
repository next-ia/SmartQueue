// Force le rendu dynamique pour always fresh data
export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import RealtimeListener from '@/components/RealtimeListener';
import { Bell, Clock, CheckCircle } from 'lucide-react';

export default async function QueuePatientPage({ params }: { params: { id: string } }) {
  const patientId = params.id;

  // Récupérer les données du patient et sa position dans la file
  const { data: queueData } = await supabase
    .from('queue')
    .select('*, patients(*)')
    .eq('patient_id', patientId)
    .single();

  const { data: patientData } = await supabase
    .from('patients')
    .select('name, status')
    .eq('id', patientId)
    .single();

  const patientName = patientData?.name || 'Patient';
  const patientStatus = patientData?.status || 'waiting';

  // Si pas dans la file et pas en attente
  if (!queueData && patientStatus !== 'waiting') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[450px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci {patientName} !</h1>
          <p className="text-gray-600">Votre passage est terminé.</p>
        </div>
      </main>
    );
  }

  // Si le patient est appelé (estimated_wait_time = 0)
  if (queueData && queueData.estimated_wait_time === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <RealtimeListener patientId={patientId} />
        
        <div className="w-full max-w-[450px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="bg-yellow-400 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Bell className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">C'est votre tour !</h1>
            <p className="text-gray-800 mt-2">Merci de vous présenter au cabinet</p>
          </div>
          <div className="p-8 text-center">
            <p className="text-lg font-medium text-gray-700">Le médecin vous attend</p>
          </div>
        </div>
      </main>
    );
  }

  // Affichage normal de la position
  const position = queueData?.position || 0;
  const estimatedWait = queueData?.estimated_wait_time || 0;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <RealtimeListener patientId={patientId} />
      
      <div className="w-full max-w-[450px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-white text-2xl font-bold">SmartQueue</h1>
          <p className="text-blue-100 text-sm">Maroc</p>
        </div>

        {/* Contenu centré */}
        <div className="p-8 flex flex-col items-center">
          {/* Avatar patient */}
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-blue-600">
              {patientName.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 mb-8">Bienvenue, {patientName}</p>

          {/* Position principale - Style Apple Health */}
          <div className="w-full bg-blue-50 rounded-[2rem] p-8 text-center mb-6">
            <p className="text-blue-800 text-sm font-medium uppercase tracking-widest mb-2">
              Votre Position
            </p>
            <div className="flex justify-center items-baseline">
              <span className="text-7xl font-black text-blue-600">{position}</span>
              {position > 0 && (
                <span className="text-blue-400 text-xl ml-2">/ {position}</span>
              )}
            </div>
          </div>

          {/* Temps d'attente */}
          <div className="w-full bg-slate-50 rounded-2xl p-4 flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-slate-500 mr-3" />
              <p className="text-slate-600 font-medium">Temps d'attente</p>
            </div>
            <p className="text-slate-900 font-bold text-lg">
              {estimatedWait > 0 ? `${estimatedWait} min` : '< 5 min'}
            </p>
          </div>

          {/* Animation d'attente */}
          <div className="flex justify-center space-x-2 mb-4">
            <div className="h-3 w-3 bg-blue-200 rounded-full animate-bounce"></div>
            <div className="h-3 w-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-3 w-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-slate-400 text-sm">Gardez cette page ouverte</p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-slate-500 text-sm">Cabinet Médical SmartQueue</p>
        </div>
      </div>
    </main>
  );
}
