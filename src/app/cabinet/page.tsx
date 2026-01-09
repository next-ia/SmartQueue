"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient, QueueEntry } from '@/types';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Loader2,
  ChevronRight,
  UserMinus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CabinetQueueEntry extends QueueEntry {
  patient?: Patient;
}

export default function CabinetPage() {
  const [queue, setQueue] = useState<CabinetQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Charger les données de la file d'attente
  const fetchQueue = async () => {
    try {
      // Récupérer la file d'attente triée par position
      const { data: queueData, error: queueError } = await supabase
        .from('queue')
        .select('*')
        .order('position', { ascending: true });

      if (queueError) throw queueError;

      // Récupérer les patients correspondants
      if (queueData && queueData.length > 0) {
        const patientIds = queueData.map(entry => entry.patient_id);
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*')
          .in('id', patientIds);

        if (patientsError) throw patientsError;

        // Fusionner les données
        const mergedQueue = queueData.map(entry => ({
          ...entry,
          patient: patientsData?.find(p => p.id === entry.patient_id)
        }));

        setQueue(mergedQueue);
      } else {
        setQueue([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la file:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour le temps réel et le chargement initial
  useEffect(() => {
    fetchQueue();

    // Abonnement aux changements en temps réel
    const subscription = supabase
      .channel('cabinet-queue-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'queue' 
      }, () => fetchQueue())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'patients' 
      }, () => fetchQueue())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Bouton "Suivant" - Appeler le premier patient
  const handleNext = async () => {
    if (queue.length === 0 || processing) return;

    const firstEntry = queue[0];
    if (!firstEntry?.patient) return;

    setProcessing(true);
    try {
      // Mettre à jour le statut du patient en "called" (en consultation)
      await supabase
        .from('patients')
        .update({ status: 'called' })
        .eq('id', firstEntry.patient_id);

      // La position reste la même, mais le temps d'attente devient 0
      await supabase
        .from('queue')
        .update({ estimated_wait_time: 0 })
        .eq('id', firstEntry.id);

      // Rafraîchir la liste
      await fetchQueue();
    } catch (error) {
      console.error('Erreur lors de l\'appel du patient:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Bouton "Annuler/Absent" (Fast Pass) - Retirer le patient et décaler les suivants
  const handleCancelAbsent = async (entryId: string, patientId: string) => {
    if (processing) return;

    setProcessing(true);
    try {
      // Marquer le patient comme absent/cancelled
      await supabase
        .from('patients')
        .update({ status: 'cancelled' })
        .eq('id', patientId);

      // Supprimer de la file d'attente
      await supabase
        .from('queue')
        .delete()
        .eq('id', entryId);

      // Les positions sont gérées par la base de données via trigger ou fonction
      // Rafraîchir la liste
      await fetchQueue();
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Marquer la consultation comme terminée
  const handleComplete = async (entryId: string, patientId: string) => {
    if (processing) return;

    setProcessing(true);
    try {
      await supabase
        .from('patients')
        .update({ status: 'completed' })
        .eq('id', patientId);

      await supabase
        .from('queue')
        .delete()
        .eq('id', entryId);

      await fetchQueue();
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Obtenir la couleur du badge selon le statut
  const getStatusBadge = (status: string, isFirst: boolean) => {
    if (status === 'called') {
      return <Badge className="bg-green-500 hover:bg-green-600">En consultation</Badge>;
    }
    if (isFirst) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">En attente</Badge>;
    }
    return <Badge className="bg-gray-400 hover:bg-gray-500">En attente</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Chargement de la file d'attente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-600" />
              Cabinet Médical
            </h1>
            <p className="text-gray-600 mt-1">Gestion de la file d'attente</p>
          </div>

          <div className="flex items-center gap-3">
            {queue.length > 0 && queue[0]?.patient?.status === 'called' && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-300">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  En consultation: {queue[0].patient.name}
                </span>
              </div>
            )}
            <Button 
              onClick={handleNext}
              disabled={queue.length === 0 || processing || (queue[0]?.patient?.status === 'called')}
              className={`${
                queue.length === 0 || queue[0]?.patient?.status === 'called' 
                  ? 'bg-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-semibold px-6 py-3 flex items-center gap-2`}
            >
              <ChevronRight className="w-5 h-5" />
              Patient Suivant
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total en attente</p>
                  <p className="text-3xl font-bold text-gray-900">{queue.length}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En consultation</p>
                  <p className="text-3xl font-bold text-green-600">
                    {queue[0]?.patient?.status === 'called' ? '1' : '0'}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Temps moyen</p>
                  <p className="text-3xl font-bold text-blue-600">15 min</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Table */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              File d&apos;Attente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {queue.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Aucun patient en attente</p>
                <p className="text-gray-400 text-sm mt-2">
                  Les patients apparaîtront ici dès leur inscription
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Position</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Patient</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Téléphone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Statut</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Heure d&apos;arrivée</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {queue.map((entry, index) => (
                      <tr 
                        key={entry.id} 
                        className={`${
                          entry.patient?.status === 'called' 
                            ? 'bg-green-50' 
                            : index % 2 === 0 
                              ? 'bg-white' 
                              : 'bg-gray-50'
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            entry.patient?.status === 'called'
                              ? 'bg-green-200 text-green-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {entry.patient?.name || 'Patient Inconnu'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {entry.patient?.phone ? (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Phone className="w-4 h-4" />
                              {entry.patient.phone}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(entry.patient?.status || 'waiting', index === 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">
                            {new Date(entry.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {entry.patient?.status === 'called' ? (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(entry.id, entry.patient_id)}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Terminer
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelAbsent(entry.id, entry.patient_id)}
                              disabled={processing}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              Absent
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Mise à jour en temps réel activée
        </div>
      </div>
    </div>
  );
}
