export interface Patient {
  id: string;
  name: string;
  phone?: string;
  created_at: string;
  status: 'waiting' | 'called' | 'cancelled' | 'completed';
}

export interface QueueEntry {
  id: string;
  patient_id: string;
  position: number;
  estimated_wait_time: number; // in minutes
  created_at: string;
  updated_at: string;
}

export interface Settings {
  clinic_name: string;
  average_consultation_time: number; // in minutes
  working_hours: {
    start: string;
    end: string;
  };
}