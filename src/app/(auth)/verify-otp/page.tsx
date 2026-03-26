'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  // Timer effect
  useEffect(() => {
    if (timer <= 0) {
      setIsOtpExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    if (isOtpExpired) {
      setError('OTP has expired. Please try logging in again.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login-step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to verify OTP');
        setLoading(false);
        return;
      }

      // OTP verified, now create NextAuth session
      const signinResult = await signIn('credentials', {
        email,
        otp: 'verified', // Special flag to indicate OTP was verified
        redirect: false,
      });

      if (!signinResult?.ok) {
        setError('Failed to create session. Please try again.');
        setLoading(false);
        return;
      }

      // Session created, redirect to dashboard
      router.push('/student');
    } catch {
      setError('An error occurred during verification');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to resend OTP');
        setLoading(false);
        return;
      }

      // Reset timer and clear state
      setTimer(600);
      setIsOtpExpired(false);
      setOtp('');
    } catch {
      setError('Failed to resend OTP');
    } finally {
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
          Verify OTP
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          Enter the 6-digit code sent to
        </p>
        <p
          style={{
            color: 'var(--accent)',
            marginBottom: '2rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {email}
        </p>

        <form onSubmit={handleVerifyOTP}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="otp"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              One-Time Password
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              disabled={loading || isOtpExpired}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                border: `1px solid ${isOtpExpired ? 'var(--danger)' : 'var(--border)'}`,
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
              }}
            />
          </div>

          {/* Timer */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '1.5rem',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius)',
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.25rem',
              }}
            >
              Time remaining
            </p>
            <p
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: isOtpExpired ? 'var(--danger)' : 'var(--accent)',
              }}
            >
              {formatTime(timer)}
            </p>
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
            disabled={loading || isOtpExpired || otp.length !== 6}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: isOtpExpired ? 'var(--text-muted)' : 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              opacity: loading || isOtpExpired || otp.length !== 6 ? 0.6 : 1,
              cursor: loading || isOtpExpired || otp.length !== 6 ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        {isOtpExpired && (
          <button
            onClick={handleResendOTP}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Sending...' : 'Resend OTP'}
          </button>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Wrong email?
          </p>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Go back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
