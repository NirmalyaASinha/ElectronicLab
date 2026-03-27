import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      id: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('[Auth] Missing email or password');
            return null;
          }

          const email = (credentials.email as string).trim().toLowerCase();
          console.log('[Auth] Attempting to authorize user with email:', email);

          const user = await db.query.users.findFirst({
            where: ilike(users.email, email),
          });

          if (!user) {
            console.error('[Auth] User not found:', email);
            return null;
          }

          if (!user.isActive) {
            console.error('[Auth] User not active:', email);
            return null;
          }

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!valid) {
            console.error('[Auth] Invalid password for user:', email);
            return null;
          }

          console.log('[Auth] User authorized successfully:', email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
          };
        } catch (error) {
          console.error('Auth authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
        token.department = user.department as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const user = session.user as { id?: string; role?: string; department?: string };
        user.id = token.id as string;
        user.role = token.role as string;
        user.department = token.department as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
