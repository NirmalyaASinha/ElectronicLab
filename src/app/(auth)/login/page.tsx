'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LoginSchema } from '@/lib/validations';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 0.5rem;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = LoginSchema.safeParse({ email, password });
      if (!validation.success) {
        showNotification('Invalid email or password', 'error');
        setLoading(false);
        return;
      }

      // First, verify credentials with NextAuth
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        showNotification('Invalid email or password', 'error');
        setLoading(false);
        return;
      }

      // If credentials are valid, send OTP
      const otpRes = await fetch('/api/auth/send-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpRes.json();

      if (otpRes.ok) {
        showNotification('OTP sent to your email!', 'success');
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}&flow=login`);
        }, 1500);
      } else {
        showNotification(otpData.error || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Login failed. Please try again.', 'error');
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
        {/* Logos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <Image
            src="/RRU.png"
            alt="RRU Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
          />
          <Image
            src="/SASET.png"
            alt="SASET Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </div>

        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
          }}
        >
          Electra Lab
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
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </div>
          </div>

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
