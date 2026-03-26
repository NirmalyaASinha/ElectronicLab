import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    department: string;
  }

  interface Session extends DefaultSession {
    user: User & DefaultSession['user'];
  }
}
