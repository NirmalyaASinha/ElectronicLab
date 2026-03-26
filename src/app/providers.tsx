'use client';

import { SessionProvider } from 'next-auth/react';
import { RequestProvider } from '@/contexts/RequestContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <RequestProvider>{children}</RequestProvider>
    </SessionProvider>
  );
}
