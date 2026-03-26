'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  UpdatePersonalInfoSchema,
  UpdatePasswordSchema,
  UpdateAcademicInfoSchema,
} from '@/lib/validations';

type UserData = {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  rollNumber?: string;
  semester?: number;
  employeeId?: string;
  createdAt: string;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Personal Info
  const [personalName, setPersonalName] = useState('');
  const [personalDept, setPersonalDept] = useState('');
  const [personalError, setPersonalError] = useState('');
  const [personalSuccess, setPersonalSuccess] = useState('');
  const [personalLoading, setPersonalLoading] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Academic
  const [rollNumber, setRollNumber] = useState('');
  const [semester, setSemester] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [academicError, setAcademicError] = useState('');
  const [academicSuccess, setAcademicSuccess] = useState('');
  const [academicLoading, setAcademicLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user) {
      const user = session.user as UserData;
      setUserData(user);
      setPersonalName(user.name);
      setPersonalDept(user.department);
      setRollNumber(user.rollNumber || '');
      setSemester(user.semester?.toString() || '');
      setEmployeeId(user.employeeId || '');
      setLoading(false);
    }
  }, [session, status, router]);

  const handlePersonalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalError('');
    setPersonalSuccess('');
    setPersonalLoading(true);

    try {
      const validation = UpdatePersonalInfoSchema.safeParse({
        name: personalName,
        department: personalDept,
      });

      if (!validation.success) {
        const errorMsg = validation.error.issues[0]?.message || 'Validation failed';
        setPersonalError(errorMsg);
        setPersonalLoading(false);
        return;
      }

      const res = await fetch('/api/profile/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setPersonalError(data.error || 'Failed to update');
      } else {
        setPersonalSuccess('Personal info updated successfully');
        setTimeout(() => setPersonalSuccess(''), 3000);
      }
    } catch {
      setPersonalError('Network error');
    } finally {
      setPersonalLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    try {
      const validation = UpdatePasswordSchema.safeParse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!validation.success) {
        const errorMsg = validation.error.issues[0]?.message || 'Validation failed';
        setPasswordError(errorMsg);
        setPasswordLoading(false);
        return;
      }

      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: validation.data.currentPassword,
          newPassword: validation.data.newPassword,
          confirmPassword: validation.data.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update');
      } else {
        setPasswordSuccess('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch {
      setPasswordError('Network error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAcademicSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcademicError('');
    setAcademicSuccess('');
    setAcademicLoading(true);

    try {
      const validation = UpdateAcademicInfoSchema.safeParse({
        rollNumber: rollNumber || undefined,
        semester: semester ? parseInt(semester) : undefined,
        employeeId: employeeId || undefined,
      });

      if (!validation.success) {
        const errorMsg = validation.error.issues[0]?.message || 'Validation failed';
        setAcademicError(errorMsg);
        setAcademicLoading(false);
        return;
      }

      const res = await fetch('/api/profile/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setAcademicError(data.error || 'Failed to update');
      } else {
        setAcademicSuccess('Academic info updated successfully');
        setTimeout(() => setAcademicSuccess(''), 3000);
      }
    } catch {
      setAcademicError('Network error');
    } finally {
      setAcademicLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1rem' }}>
          Loading...
        </h1>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const role = userData.role as string;
  const isStudent = role === 'STUDENT';
  const isFaculty = role === 'FACULTY';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '2rem',
          color: 'var(--text-primary)',
        }}
      >
        Profile Settings
      </h1>

      {/* Personal Info Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          Personal Information
        </h2>

        <form onSubmit={handlePersonalSave}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={personalName}
              onChange={(e) => setPersonalName(e.target.value)}
              disabled={personalLoading}
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

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Department
            </label>
            <input
              type="text"
              value={personalDept}
              onChange={(e) => setPersonalDept(e.target.value)}
              disabled={personalLoading}
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

          {personalError && (
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
              {personalError}
            </div>
          )}

          {personalSuccess && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {personalSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={personalLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: personalLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: personalLoading ? 0.6 : 1,
            }}
          >
            {personalLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Security Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          Security
        </h2>

        <form onSubmit={handlePasswordSave}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              disabled={passwordLoading}
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

          <div style={{ marginBottom: '1rem' }}>
            <label
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
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 chars)"
              disabled={passwordLoading}
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

          <div style={{ marginBottom: '1rem' }}>
            <label
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
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={passwordLoading}
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

          {passwordError && (
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
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {passwordSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: passwordLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: passwordLoading ? 0.6 : 1,
            }}
          >
            {passwordLoading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Academic Info Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          Academic Information
        </h2>

        <form onSubmit={handleAcademicSave}>
          {isStudent && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  Roll Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Your roll number"
                  disabled={academicLoading}
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

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={academicLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-base)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s.toString()}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {isFaculty && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Your employee ID"
                disabled={academicLoading}
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
          )}

          {academicError && (
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
              {academicError}
            </div>
          )}

          {academicSuccess && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {academicSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={academicLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: academicLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: academicLoading ? 0.6 : 1,
            }}
          >
            {academicLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Info Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          Account Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
              }}
            >
              Email
            </p>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              {userData.email}
            </p>
          </div>

          <div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
              }}
            >
              Role
            </p>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              {userData.role}
            </p>
          </div>

          <div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
              }}
            >
              Member Since
            </p>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              {new Date(userData.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
