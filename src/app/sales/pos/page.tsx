'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/core/state/useSessionStore';
import { POS } from '@/components/sales/POS';

export default function PosPage() {
  const router = useRouter();
  const { currentUser } = useSessionStore();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return null;
  }

  return <POS />;
}