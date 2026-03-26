'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginSchema } from '@/lib/validations';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(`Authentication error: ${errorParam}`);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const validation = LoginSchema.safeParse({ email, password });
      if (!validation.success) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Step 1: Submit credentials and request OTP
      const response = await fetch('/api/auth/login-step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Credentials verified, redirect to OTP verification
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-base)',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-surface)',
          padding: '2rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
      >
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
          }}
        >
          ElecTronic Lab
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            fontSize: '0.875rem',
          }}
        >
          Component Management System
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: 'var(--danger)',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Don&apos;t have an account?
          </p>
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
