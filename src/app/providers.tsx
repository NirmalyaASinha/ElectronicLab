'use client';

import { SessionProvider } from 'next-auth/react';
import { RequestProvider } from '@/contexts/RequestContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <RequestProvider>{children}</RequestProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
