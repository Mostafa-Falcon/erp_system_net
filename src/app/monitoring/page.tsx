'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MonitoringDashboard } from '@/components/monitoring/monitoring-dashboard';

export default function MonitoringPage() {
  return (
    <AppShell>
      <MonitoringDashboard />
    </AppShell>
  );
}
