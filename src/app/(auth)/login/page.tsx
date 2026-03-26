'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LoginSchema } from '@/lib/validations';
import { sendOTP, verifyOTP } from '@/lib/appwrite-auth';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  // OTP Flow State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Password Flow State
  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const showNotification = (
    message: string,
    type: 'success' | 'error' = 'error'
  ) => {
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

  // OTP Flow Handlers
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      if (!otpEmail) {
        setOtpError('Please enter your email');
        setOtpLoading(false);
        return;
      }

      const id = await sendOTP(otpEmail);
      setUserId(id);
      setOtpStep('code');
      setResendTimer(60);
      showNotification('OTP sent to your email!', 'success');
    } catch (error: any) {
      setOtpError(error.message || 'Failed to send OTP');
      showNotification(
        error.message || 'Failed to send OTP',
        'error'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      if (!otpCode) {
        setOtpError('Please enter the OTP code');
        setOtpLoading(false);
        return;
      }

      if (!userId) {
        setOtpError('Session expired. Please try again.');
        setOtpLoading(false);
        return;
      }

      const isValid = await verifyOTP(userId, otpCode);

      if (!isValid) {
        setOtpError('Invalid OTP. Please try again.');
        setOtpLoading(false);
        return;
      }

      // OTP verified! Now create Auth.js session
      showNotification('OTP verified! Logging in...', 'success');

      const res = await fetch('/api/auth/appwrite-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || 'Login failed');
        showNotification(data.error || 'Login failed', 'error');
        setOtpLoading(false);
        return;
      }

      // Redirect based on role
      router.push(data.redirectUrl);
    } catch (error: any) {
      setOtpError(error.message || 'Failed to verify OTP');
      showNotification(
        error.message || 'Failed to verify OTP',
        'error'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpError('');
    setOtpLoading(true);

    try {
      const id = await sendOTP(otpEmail);
      setUserId(id);
      setResendTimer(60);
      showNotification('OTP resent to your email!', 'success');
    } catch (error: any) {
      setOtpError(error.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Password Flow Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordLoading(true);

    try {
      const validation = LoginSchema.safeParse({
        email: passwordEmail,
        password,
      });

      if (!validation.success) {
        setPasswordError('Invalid email or password');
        setPasswordLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: passwordEmail,
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        setPasswordError('Invalid email or password');
        showNotification('Invalid email or password', 'error');
        setPasswordLoading(false);
        return;
      }

      // Get session to determine redirect
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (session?.user?.role) {
        showNotification('Login successful!', 'success');
        const redirectPath =
          session.user.role === 'STUDENT'
            ? '/dashboard/student'
            : session.user.role === 'FACULTY'
              ? '/dashboard/faculty'
              : '/dashboard/admin';
        router.push(redirectPath);
      }
    } catch (error) {
      setPasswordError('Login failed. Please try again.');
      showNotification('Login failed. Please try again.', 'error');
    } finally {
      setPasswordLoading(false);
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

        {/* OTP LOGIN FORM (Primary) */}
        {otpStep === 'email' ? (
          <form onSubmit={handleSendOTP} style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="otp-email"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              >
                Login with OTP
              </label>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="otp-email"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              >
                Email
              </label>
              <input
                id="otp-email"
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="you@university.edu"
                disabled={otpLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${
                    otpError ? 'var(--error)' : 'var(--border)'
                  }`,
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
              />
              {otpError && (
                <p
                  style={{
                    color: 'var(--error)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {otpError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--accent)',
                color: 'white',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                opacity: otpLoading ? 0.6 : 1,
                cursor: otpLoading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {otpLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem',
                }}
              >
                OTP sent to {otpEmail}
              </p>
              <button
                type="button"
                onClick={() => setOtpStep('email')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  padding: 0,
                }}
              >
                (change email)
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="otp-code"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              >
                Verification Code
              </label>
              <input
                id="otp-code"
                type="text"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                }
                placeholder="000000"
                disabled={otpLoading}
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${
                    otpError ? 'var(--error)' : 'var(--border)'
                  }`,
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                  fontSize: '1.25rem',
                  letterSpacing: '0.5rem',
                  textAlign: 'center',
                }}
              />
              {otpError && (
                <p
                  style={{
                    color: 'var(--error)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {otpError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpCode.length !== 6}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor:
                  otpCode.length === 6 ? 'var(--accent)' : 'var(--bg-secondary)',
                color: 'white',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                opacity: otpLoading ? 0.6 : 1,
                cursor:
                  otpLoading || otpCode.length !== 6
                    ? 'not-allowed'
                    : 'pointer',
                border: 'none',
              }}
            >
              {otpLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || otpLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendTimer > 0 ? 'var(--text-secondary)' : 'var(--accent)',
                  textDecoration: 'underline',
                  cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  padding: 0,
                }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '2rem 0',
            gap: '1rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            OR
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* PASSWORD LOGIN FORM (Fallback) */}
        <form onSubmit={handlePasswordLogin}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label
              htmlFor="password-email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            >
              Login with Password
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="password-email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            >
              Email
            </label>
            <input
              id="password-email"
              type="email"
              value={passwordEmail}
              onChange={(e) => setPasswordEmail(e.target.value)}
              placeholder="you@university.edu"
              disabled={passwordLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                border: `1px solid ${
                  passwordError ? 'var(--error)' : 'var(--border)'
                }`,
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
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
                fontSize: '0.875rem',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={passwordLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                border: `1px solid ${
                  passwordError ? 'var(--error)' : 'var(--border)'
                }`,
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
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
            {passwordError && (
              <p
                style={{
                  color: 'var(--error)',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                }}
              >
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              opacity: passwordLoading ? 0.6 : 1,
              cursor: passwordLoading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {passwordLoading ? 'Signing in...' : 'Sign In with Password'}
          </button>
        </form>

        {/* Sign Up Link */}
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

