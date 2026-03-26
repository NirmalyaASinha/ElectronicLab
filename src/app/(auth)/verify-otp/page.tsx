'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get('email') || '';
  const flow = searchParams.get('flow') || 'register'; // register | login | reset
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      showNotification('Email information missing. Please register again.', 'error');
      setLoading(false);
      return;
    }

    if (!otp) {
      showNotification('Please enter the OTP code', 'error');
      setLoading(false);
      return;
    }

    // Trim and clean the OTP
    const cleanOTP = otp.trim();

    if (cleanOTP.length !== 6) {
      showNotification('OTP must be 6 digits', 'error');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(cleanOTP)) {
      showNotification('OTP must contain only numbers', 'error');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: cleanOTP }),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('OTP verified successfully!', 'success');
        
        // Handle different flows
        setTimeout(async () => {
          if (flow === 'register') {
            router.push('/login?verified=true');
          } else if (flow === 'login') {
            // Sign in the user after OTP verification
            const signInRes = await fetch('/api/auth/signin-after-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });

            if (signInRes.ok) {
              router.push('/dashboard');
            } else {
              showNotification('Login failed', 'error');
            }
          } else if (flow === 'reset') {
            // Create a temporary reset token for password change
            const tokenRes = await fetch('/api/auth/create-reset-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });

            const tokenData = await tokenRes.json();
            if (tokenRes.ok && tokenData.resetToken) {
              router.push(`/reset-password/${tokenData.resetToken}`);
            } else {
              showNotification('Failed to prepare password reset', 'error');
            }
          }
        }, 1500);
      } else {
        showNotification(data.error || 'Invalid OTP', 'error');
      }
    } catch (error) {
      showNotification('Failed to verify OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const res = await fetch(`/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('OTP sent again!', 'success');
        setTimeLeft(60);
      } else {
        showNotification(data.error || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      showNotification('Failed to resend OTP', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const flowTitles = {
    register: 'Verify Email Address',
    login: 'Verify Login',
    reset: 'Verify Password Reset',
  };

  const flowMessages = {
    register: 'A verification code has been sent to your email',
    login: 'Enter the code sent to your email to complete login',
    reset: 'Enter the code sent to your email to reset your password',
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

        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            {flowTitles[flow as keyof typeof flowTitles] || 'Verify Code'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {flowMessages[flow as keyof typeof flowMessages] || 'Please verify your identity'}
          </p>
        </div>

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
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              disabled={loading}
              maxLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Sent to: {email}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: otp.length === 6 ? 'var(--accent)' : 'var(--bg-secondary)',
              color: 'white',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Didn&apos;t receive the code?
          </p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={timeLeft > 0 || resendLoading}
            style={{
              background: 'none',
              border: 'none',
              color: timeLeft > 0 ? 'var(--text-secondary)' : 'var(--accent)',
              fontWeight: 600,
              cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
              padding: 0,
              fontSize: '0.875rem',
            }}
          >
            {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend Code'}
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <Link
            href={
              flow === 'register'
                ? '/register'
                : flow === 'login'
                  ? '/login'
                  : '/forgot-password'
            }
            style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            {flow === 'register'
              ? 'Back to signup'
              : flow === 'login'
                ? 'Back to login'
                : 'Back to password reset'}
          </Link>
        </div>
      </div>
    </div>
  );
}
