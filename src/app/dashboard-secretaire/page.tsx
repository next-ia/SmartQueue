import DashboardSecretaire from '@/components/DashboardSecretaire';
import RealtimeListener from '@/components/RealtimeListener';

export default function DashboardPage() {
  return (
    <>
      {/* RealtimeListener pour sync en temps réel sur le dashboard */}
      <RealtimeListener patientId="dashboard" />
      <DashboardSecretaire />
    </>
  );
}