'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as 'STUDENT' | 'FACULTY' | 'ADMIN',
    department: '',
    rollNumber: '',
    employeeId: '',
    semester: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

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
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.email || !formData.name || !formData.password) {
      setError('Email, name, and password are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (formData.role === 'STUDENT' && (!formData.rollNumber || !formData.semester)) {
      setError('Roll number and semester are required for students');
      setLoading(false);
      return;
    }

    if (formData.role === 'FACULTY' && !formData.employeeId) {
      setError('Employee ID is required for faculty');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        showNotification(data.error || 'Failed to create user', 'error');
        setLoading(false);
        return;
      }

      setSuccess(data.message || 'User created successfully!');
      showNotification('User created successfully!', 'success');
      
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (_err) {
      setError('Failed to create user. Please try again.');
      showNotification('Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Create New User
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Add a new user to the system (Student, Faculty, or Admin)
        </p>
      </div>

      <div
        style={{
          maxWidth: '600px',
          backgroundColor: 'var(--bg-surface)',
          padding: '2rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div
              style={{
                padding: '0.875rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '0.875rem',
                backgroundColor: '#dcfce7',
                color: '#166534',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                border: '1px solid #86efac',
              }}
            >
              {success}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Email *
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            >
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label
              htmlFor="department"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Department
            </label>
            <input
              id="department"
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Electronics & Communication"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Student-specific fields */}
          {formData.role === 'STUDENT' && (
            <>
              <div>
                <label
                  htmlFor="rollNumber"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  Roll Number *
                </label>
                <input
                  id="rollNumber"
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="24001"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--bg-base)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="semester"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  Semester *
                </label>
                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--bg-base)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select semester</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </div>
            </>
          )}

          {/* Faculty-specific fields */}
          {formData.role === 'FACULTY' && (
            <div>
              <label
                htmlFor="employeeId"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                Employee ID *
              </label>
              <input
                id="employeeId"
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="F001"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Password (min. 8 characters) *
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.875rem',
                backgroundColor: loading ? 'var(--accent-muted)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <Link href="/admin">
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
