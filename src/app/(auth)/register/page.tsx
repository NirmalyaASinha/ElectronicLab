'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterSchema } from '@/lib/validations';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STUDENT' as 'STUDENT' | 'FACULTY',
    department: '',
    rollNumber: '',
    employeeId: '',
    semester: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const validation = RegisterSchema.safeParse({
        ...formData,
        semester: formData.semester ? parseInt(formData.semester) : undefined,
      });

      if (!validation.success) {
        setError('Please fill all required fields correctly');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      router.push('/login');
    } catch {
      setError('Registration failed. Please try again.');
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
          maxWidth: '500px',
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
          Create Account
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            fontSize: '0.875rem',
          }}
        >
          Join ElecTronic Lab Management System
        </p>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@university.edu"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Role
            </label>
            <select name="role" value={formData.role} onChange={handleChange} disabled={loading}>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Electronics"
              disabled={loading}
            />
          </div>

          {formData.role === 'STUDENT' && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="ECE2021001"
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Semester
                </label>
                <select name="semester" value={formData.semester} onChange={handleChange} disabled={loading}>
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {formData.role === 'FACULTY' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="FAC123456"
                disabled={loading}
              />
            </div>
          )}

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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Already have an account?
          </p>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
