import type { Metadata } from 'next';
import { Providers } from './providers';
import { AppwritePing } from '@/components/AppwritePing';
import './globals.css';

export const metadata: Metadata = {
  title: 'ElecTronic Lab Management',
  description: 'University Electronics Lab Component Management System',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <AppwritePing />
      </body>
    </html>
  );
}
