'use client';

import { useEffect } from 'react';
import { client } from '@/lib/appwrite';

export function AppwritePing() {
  useEffect(() => {
    client
      .ping()
      .then(() => console.log('[Appwrite] Connection verified'))
      .catch((err) => console.error('[Appwrite] Ping failed:', err));
  }, []);

  return null;
}
