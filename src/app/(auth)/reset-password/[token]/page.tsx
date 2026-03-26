'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Validate token
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/validate-reset-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        setIsValid(data.valid);
      } catch (_error) {
        setIsValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords
    if (!passwords.newPassword || !passwords.confirmPassword) {
      showNotification('Please enter both passwords', 'error');
      setLoading(false);
      return;
    }

    if (passwords.newPassword.length < 8) {
      showNotification('Password must be at least 8 characters', 'error');
      setLoading(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCompleted(true);
        showNotification('Password reset successfully!', 'success');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showNotification(data.error || 'Failed to reset password', 'error');
      }
    } catch (_error) {
      showNotification('Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div style={{ color: 'var(--text-primary)', textAlign: 'center' }}>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-secondary)',
          padding: '1rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--bg-base)',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h1 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Invalid or Expired Link
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            The password reset link has expired or is invalid. Please request a new one.
          </p>
          <Link href="/forgot-password" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'var(--bg-base)',
          borderRadius: 'var(--radius)',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Create New Password
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Enter a new password for your account
          </p>
        </div>

        {completed ? (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
              color: '#10b981',
            }}
          >
            <p style={{ marginBottom: '1rem' }}>✓ Password reset successfully!</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="newPassword"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Must be at least 8 characters
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
              />
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
                border: 'none',
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
