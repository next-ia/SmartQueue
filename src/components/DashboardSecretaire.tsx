"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Patient, QueueEntry } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Zap, AlertCircle, X, PlusCircle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Couleurs de la charte DA - Bleu Majorelle/Cobalt pour le professionnalisme
const PRIMARY_COLOR = 'bg-blue-600';
const PRIMARY_COLOR_TEXT = 'text-blue-600';
const HOVER_COLOR = 'hover:bg-blue-700';

const DashboardSecretaire: React.FC = () => {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [settings, setSettings] = useState<{ average_consultation_time: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalPatientName, setModalPatientName] = useState('');
  const [modalPatientPhone, setModalPatientPhone] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const getPatientData = useCallback((patientId: string) => patients.find((p) => p.id === patientId), [patients]);

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel('public:queue_and_patients_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: queueData, error: queueError } = await supabase.from('queue').select('*').order('position', { ascending: true });
      const { data: patientsData, error: patientsError } = await supabase.from('patients').select('*');
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('average_consultation_time').single();

      if (queueError) console.error('Erreur lors de la récupération de la file:', queueError.message);
      if (patientsError) console.error('Erreur lors de la récupération des patients:', patientsError.message);
      if (settingsError) console.error('Erreur lors de la récupération des paramètres:', settingsError.message);

      if (queueData) setQueue(queueData as QueueEntry[]);
      if (patientsData) setPatients(patientsData as Patient[]);
      if (settingsData) setSettings(settingsData as { average_consultation_time: number });
    } catch (error) {
      console.error("Erreur générale lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedWaitTime = useCallback((position: number) => {
    if (!settings || position <= 1) return 0;
    return (position - 1) * settings.average_consultation_time;
  }, [settings]);

  const handleCallNext = async () => {
    if (queue.length === 0) return;

    const nextPatientEntry = queue[0];
    console.log('Appel du patient:', nextPatientEntry.id);

    const { error } = await supabase
      .from('queue')
      .update({ estimated_wait_time: 0 })
      .eq('id', nextPatientEntry.id);
    
    if (error) {
      console.error("Erreur lors de la mise à jour du statut:", error.message);
    } else {
      console.log('Patient appelé, rafraîchissement...')
      // Petit délai pour laisser le temps à Supabase de répondre
      setTimeout(() => {
        fetchData();
        router.refresh();
        window.location.reload();
        console.log('Données rafraîchies');
      }, 500);
    }
  };

  const handleCancelPatient = async (queueEntryId: string, patientId: string) => {
    console.log('Annulation du patient:', patientId);
    const { error: cancelError } = await supabase.from('patients').update({ status: 'cancelled' }).eq('id', patientId);
    if (cancelError) {
      console.error('Erreur lors de l\'annulation:', cancelError.message);
      return;
    }
    const { error: deleteError } = await supabase.from('queue').delete().eq('id', queueEntryId);
    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError.message);
      return;
    }
    console.log('Patient annulé, rafraîchissement...')
    setTimeout(() => {
      fetchData();
      router.refresh();
      window.location.reload();
      console.log('Données rafraîchies après annulation');
    }, 500);
  };

  const handleCompletePatient = async (queueEntryId: string, patientId: string) => {
    console.log('Terminaison du patient:', patientId);
    const { error: completeError } = await supabase.from('patients').update({ status: 'completed' }).eq('id', patientId);
    if (completeError) {
      console.error('Erreur lors de la complétion:', completeError.message);
      return;
    }
    const { error: deleteError } = await supabase.from('queue').delete().eq('id', queueEntryId);
    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError.message);
      return;
    }
    console.log('Patient terminé, rafraîchissement...')
    setTimeout(() => {
      fetchData();
      router.refresh();
      window.location.reload();
      console.log('Données rafraîchies après complétion');
    }, 500);
  };

  const handleAddPatientFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPatientName.trim()) return;

    setModalLoading(true);
    try {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({ name: modalPatientName.trim(), phone: modalPatientPhone.trim() || undefined })
        .select()
        .single();

      if (patientError) throw patientError;
      if (!newPatient) throw new Error("Échec de la création du patient");

      const nextPosition = queue.length + 1;
      const estWaitTime = calculateEstimatedWaitTime(nextPosition);

      const { error: queueError } = await supabase
        .from('queue')
        .insert({ 
          patient_id: newPatient.id, 
          position: nextPosition,
          estimated_wait_time: estWaitTime 
        });

      if (queueError) throw queueError;
      
      setShowAddModal(false);
      setModalPatientName('');
      setModalPatientPhone('');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'ajout du patient";
      console.error("Erreur lors de l'ajout du patient:", errorMessage);
      alert("Erreur: " + errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  const getPatientName = useCallback((patientId: string) => {
    const patient = getPatientData(patientId);
    return patient ? patient.name : 'N/A';
  }, [getPatientData]);

  if (loading && queue.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader2 className={`w-8 h-8 mr-2 animate-spin ${PRIMARY_COLOR_TEXT}`} />
        <p className={`${PRIMARY_COLOR_TEXT} text-xl font-medium`}>Initialisation du système...</p>
      </div>
    );
  }

  const nextPatientEntry = queue[0];
  const nextPatientName = nextPatientEntry ? getPatientName(nextPatientEntry.patient_id) : 'N/A';

  if (showAddModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ajouter un Patient</h2>
          <form onSubmit={handleAddPatientFromModal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Patient *</label>
              <input
                type="text"
                value={modalPatientName}
                onChange={(e) => setModalPatientName(e.target.value)}
                placeholder="Entrez le nom"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (optionnel)</label>
              <input
                type="tel"
                value={modalPatientPhone}
                onChange={(e) => setModalPatientPhone(e.target.value)}
                placeholder="06 XX XX XX XX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setModalPatientName('');
                  setModalPatientPhone('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!modalPatientName.trim() || modalLoading}
                className={`flex-1 ${PRIMARY_COLOR} ${HOVER_COLOR} text-white`}
              >
                {modalLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Valider'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4">
          <h1 className={`text-3xl font-extrabold text-gray-900 mb-4 md:mb-0`}>SmartQueue: File d'attente</h1>
          <div className="flex space-x-3 items-center">
            {nextPatientEntry && nextPatientEntry.estimated_wait_time === 0 && (
              <p className="text-sm text-green-800 font-bold flex items-center bg-green-100 p-2 rounded-lg shadow-md border border-green-300">
                <Zap className="w-4 h-4 mr-1"/> Patient Actuel: {nextPatientName}
              </p>
            )}
            <Button
              onClick={handleCallNext}
              disabled={queue.length === 0}
              className={`text-white font-bold shadow-md transition duration-300 flex items-center ${queue.length === 0 ? 'bg-gray-400 cursor-not-allowed' : `${PRIMARY_COLOR} ${HOVER_COLOR}`}`}
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />} 
              Appeler le Suivant 
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className={`${PRIMARY_COLOR} ${HOVER_COLOR} text-white font-bold shadow-md transition duration-300 flex items-center`}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              + Ajouter un patient
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">File d'Attente ({queue.length} patients)</CardTitle>
              </CardHeader>
              <CardContent>
                {queue.length === 0 ? (
                  <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-lg">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">La file d'attente est vide. Ajoutez un patient ci-dessous.</p>
                  </div>
                ) : (
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="text-left">Position</TableHead>
                        <TableHead className="text-left">Patient</TableHead>
                        <TableHead className="text-left">Temps d'attente</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queue.map((entry) => {
                        const patient = patients.find(p => p.id === entry.patient_id);
                        const patientName = patient ? patient.name : 'Patient Inconnu';
                        const isCalled = entry.estimated_wait_time === 0;

                        return (
                          <TableRow 
                            key={entry.id}
                            className={isCalled ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white hover:bg-gray-100 transition duration-150 border-b'}
                          >
                            <TableCell className="font-medium text-gray-900">
                              #{entry.position}
                            </TableCell>
                            <TableCell className="w-[40%]">
                              <div className="flex flex-col">
                                <span className={`font-semibold ${isCalled ? 'text-green-800' : 'text-gray-800'}`}>{patientName}</span>
                                {patient && (
                                  <p className="text-xs text-gray-500 mt-1">Statut: {patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : 'Inconnu'}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 w-[25%]">
                              {isCalled ? (
                                <span className="font-bold text-green-700 flex items-center"><Check className="w-3 h-3 mr-1"/> EN CONSULTATION</span>
                              ) : entry.estimated_wait_time > 0 ? 
                                  `${entry.estimated_wait_time} min avant approx.` : 'Attente...'}
                            </TableCell>
                            <TableCell className="text-right w-[30%]">
                              {!isCalled ? (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="icon" 
                                          className="text-red-600 border-red-300 hover:bg-red-50 mr-2"
                                          onClick={() => handleCancelPatient(entry.id, entry.patient_id)}
                                          title="Annuler"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Annuler et retirer de la file</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="icon" 
                                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                          onClick={() => handleCompletePatient(entry.id, entry.patient_id)}
                                          title="Marquer comme Terminé"
                                        >
                                          <Check className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marquer comme terminé et retirer de la file</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              ) : (
                                <Button 
                                  variant="default" 
                                  className={`${PRIMARY_COLOR} ${HOVER_COLOR}`}
                                  onClick={() => handleCompletePatient(entry.id, entry.patient_id)}
                                  title="Terminer la consultation"
                                >
                                  Terminer
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">Infos Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Temps moyen par consultation: <span className="font-bold text-gray-800">{`${settings?.average_consultation_time ?? 'N/A'} min`}</span></p>
                
                {nextPatientEntry && (
                  <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Prochain ({nextPatientEntry.position}): {nextPatientName}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Est. Attente: {nextPatientEntry.estimated_wait_time === 0 ? 'Maintenant' : `${nextPatientEntry.estimated_wait_time} minutes`}.
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-400 pt-2">Les changements dans la file sont répercutés en temps réel.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DashboardSecretaire;
