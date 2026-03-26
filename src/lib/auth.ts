import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
            return null;
          }

          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email as string),
          });

          if (!user || !user.isActive) {
            return null;
          }

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!valid) {
            return null;
          }

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
    Credentials({
      id: 'appwrite-otp',
      credentials: {
        email: { label: 'Email', type: 'text' },
        userId: { label: 'User ID', type: 'text' },
        name: { label: 'Name', type: 'text' },
        role: { label: 'Role', type: 'text' },
        department: { label: 'Department', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) {
            return null;
          }

          // User already verified via Appwrite OTP
          // Just return the user data from credentials
          return {
            id: credentials.userId as string,
            email: credentials.email as string,
            name: credentials.name as string,
            role: credentials.role as string,
            department: credentials.department as string,
          };
        } catch (error) {
          console.error('Appwrite OTP authorize error:', error);
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
