"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

/**
 * Server Action pour ajouter un patient via FormData
 */
export async function addPatient(formData: FormData) {
  console.log('Server Action: addPatient');

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  if (!name || !name.trim()) {
    throw new Error("Le nom du patient est requis");
  }

  try {
    // Créer le patient
    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert({ 
        name: name.trim(), 
        phone: phone?.trim() || null,
        status: "waiting"
      })
      .select()
      .single();

    if (patientError) throw patientError;
    if (!newPatient) throw new Error("Échec de la création du patient");

    // Récupérer le nombre de patients dans la file pour la position
    const { count } = await supabase
      .from("queue")
      .select("*", { count: "exact", head: true });

    const nextPosition = (count || 0) + 1;

    // Ajouter à la file d'attente
    const { error: queueError } = await supabase
      .from("queue")
      .insert({
        patient_id: newPatient.id,
        position: nextPosition,
        estimated_wait_time: nextPosition > 1 ? (nextPosition - 1) * 15 : 0
      });

    if (queueError) throw queueError;

    console.log('Patient ajouté avec succès:', newPatient.id);
    
    // LA CLÉ : Invalider le cache pour mettre à jour l'affichage
    revalidatePath("/dashboard-secretaire");
    
    return { success: true, patientId: newPatient.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error('Erreur addPatient:', message);
    throw new Error(message);
  }
}

/**
 * Server Action pour appeler le patient suivant
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
    const { error: patientError } = await supabase
      .from("patients")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", patientId);

    if (patientError) throw patientError;

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
    const { error: patientError } = await supabase
      .from("patients")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", patientId);

    if (patientError) throw patientError;

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
