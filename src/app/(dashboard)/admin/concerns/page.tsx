'use client';

import ConcernsPage from '@/components/ConcernsPage';

export const dynamic = 'force-dynamic';

export default function AdminConcernsRoute() {
  return <ConcernsPage role="ADMIN" />;
}
