'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session) {
      const role = session.user.role;
      if (role === 'STUDENT') {
        router.push('/student');
      } else if (role === 'FACULTY') {
        router.push('/faculty');
      } else if (role === 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [status, session, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p>Loading...</p>
    </div>
  );
}
