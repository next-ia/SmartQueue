"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

/**
 * Server Action pour appeler le patient suivant
 * Met à jour estimated_wait_time à 0 pour indiquer que le patient est appelé
 */
export async function callNextPatient(queueId: string) {
  console.log('Server Action: callNextPatient', queueId);

  const { data, error } = await supabase
    .from("queue")
    .update({ 
      estimated_wait_time: 0,
      updated_at: new Date().toISOString() 
    })
    .eq("id", queueId)
    .select()
    .single();

  if (error) {
    console.error("Erreur callNextPatient:", error.message);
    throw new Error(error.message);
  }

  console.log('Patient appelé avec succès:', data);
  revalidatePath("/dashboard-secretaire");
  return data;
}

/**
 * Server Action pour marquer un patient comme terminé
 */
export async function completePatient(queueId: string, patientId: string) {
  console.log('Server Action: completePatient', queueId, patientId);

  try {
    // Marquer le patient comme terminé
    const { error: patientError } = await supabase
      .from("patients")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", patientId);

    if (patientError) throw patientError;

    // Supprimer de la file d'attente
    const { error: queueError } = await supabase
      .from("queue")
      .delete()
      .eq("id", queueId);

    if (queueError) throw queueError;

    console.log('Patient terminé avec succès');
    revalidatePath("/dashboard-secretaire");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur completePatient:", message);
    throw new Error(message);
  }
}

/**
 * Server Action pour annuler un patient
 */
export async function cancelPatient(queueId: string, patientId: string) {
  console.log('Server Action: cancelPatient', queueId, patientId);

  try {
    // Marquer le patient comme annulé
    const { error: patientError } = await supabase
      .from("patients")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", patientId);

    if (patientError) throw patientError;

    // Supprimer de la file d'attente
    const { error: queueError } = await supabase
      .from("queue")
      .delete()
      .eq("id", queueId);

    if (queueError) throw queueError;

    console.log('Patient annulé avec succès');
    revalidatePath("/dashboard-secretaire");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur cancelPatient:", message);
    throw new Error(message);
  }
}
