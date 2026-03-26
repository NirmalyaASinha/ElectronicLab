'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequestStore } from '@/store/requestStore';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { Send, AlertCircle, Loader } from 'lucide-react';
import { toIST } from '@/lib/date-utils';

interface Faculty {
  id: string;
  name: string;
  department?: string;
  email?: string;
}

export const dynamic = 'force-dynamic';

export default function RequestProceed() {
  const router = useRouter();
  const store = useRequestStore();
  const items = store.items || [];

  const [purpose, setPurpose] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/faculty');
      const data = await res.json();
      
      if (data.success && data.data) {
        setFaculty(data.data);
      }
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setError('Failed to load faculty list');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!purpose.trim()) {
      setError('Purpose is required');
      return;
    }

    if (purpose.trim().length < 10) {
      setError('Purpose must be at least 10 characters');
      return;
    }

    if (purpose.length > 500) {
      setError('Purpose must not exceed 500 characters');
      return;
    }

    if (!facultyId) {
      setError('Please select a faculty member');
      return;
    }

    if (items.length === 0) {
      setError('No components in your request');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        purpose: purpose.trim(),
        facultyId,
        durationDays: parseInt(durationDays.toString()),
        items: items.map((item) => ({
          componentId: item.componentId,
          quantity: item.quantity,
        })),
      };

      console.log('Submitting payload:', payload);

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log('Response:', { status: res.status, data });

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to submit request');
      }

      // Clear store on success
      store.clearRequest();

      // Show success notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        backgroundColor: #10b981;
        color: white;
        borderRadius: 6px;
        fontSize: 13px;
        fontWeight: 500;
        boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        zIndex: 9999;
        animation: slideIn 0.3s ease;
      `;
      notification.textContent = 'Request submitted successfully!';
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
      
      setTimeout(() => router.push('/student/request'), 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit request';
      console.error('Submit error:', errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin" size={32} />
        </div>
      </PageTransition>
    );
  }

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
              Submit Request
            </h1>
            <p className="text-[var(--text-secondary)]">
              No components in your request
            </p>
          </div>
          <button
            onClick={() => router.push('/student/request')}
            className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
          >
            Back to Request
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Submit Component Request 📝
          </h1>
          <p className="text-[var(--text-secondary)]">
            Complete the form below to submit your request to faculty
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Request Summary */}
          <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] space-y-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Request Summary
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-[var(--text-primary)]">
                      Component
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-[var(--text-primary)]">
                      Category
                    </th>
                    <th className="px-4 py-2 text-center font-semibold text-[var(--text-primary)]">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-[var(--text-primary)]">
                      Max Days
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {items.map((item) => (
                    <tr key={item.componentId} className="hover:bg-[var(--bg-elevated)]">
                      <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 text-[var(--text-secondary)]">
                        {item.category}
                      </td>
                      <td className="px-4 py-2 text-center font-semibold text-[var(--accent)]">
                        {item.quantity}x
                      </td>
                      <td className="px-4 py-2 text-right text-[var(--text-secondary)]">
                        {item.maxDays} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Total Components:</span>
              <span className="text-xl font-bold text-[var(--accent)]">
                {store.totalItems()} item{store.totalItems() !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Section 2: Purpose */}
          <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--text-primary)] mb-2 block">
                Purpose of Request <span className="text-[var(--danger)]">*</span>
              </span>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Mini Project - Line Following Robot"
                className={`w-full px-4 py-3 bg-[var(--bg-base)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none min-h-24 resize-none transition-colors ${
                  purpose.length > 0 && purpose.trim().length < 10
                    ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                    : 'border-[var(--border)] focus:border-[var(--accent)]'
                }`}
                maxLength={500}
              />
              <div className="mt-2 flex justify-between items-center text-xs">
                <span className={`${
                  purpose.length === 0 
                    ? 'text-[var(--text-secondary)]'
                    : purpose.trim().length < 10
                    ? 'text-[var(--danger)]'
                    : 'text-[var(--success)]'
                }`}>
                  {purpose.length} / 500 characters
                  {purpose.trim().length >= 10 && ' ✓'}
                </span>
                {purpose.length > 0 && purpose.trim().length < 10 && (
                  <span className="text-[var(--danger)] font-semibold">
                    {10 - purpose.trim().length} more characters needed
                  </span>
                )}
              </div>
            </label>
          </div>

          {/* Section 3: Faculty Selection */}
          <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--text-primary)] mb-2 block">
                Select Faculty Advisor <span className="text-[var(--danger)]">*</span>
              </span>
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                className={`w-full px-4 py-3 bg-[var(--bg-base)] border rounded-lg text-[var(--text-primary)] focus:outline-none transition-colors ${
                  !facultyId && error
                    ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                    : 'border-[var(--border)] focus:border-[var(--accent)]'
                }`}
              >
                <option value="">Choose a faculty member...</option>
                {faculty.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                    {fac.department ? ` — ${fac.department}` : ''}
                  </option>
                ))}
              </select>
              {!facultyId && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  This faculty member will approve or reject your request
                </p>
              )}
            </label>
          </div>

          {/* Section 4: Issue Duration */}
          <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] space-y-4">
            <span className="text-sm font-semibold text-[var(--text-primary)] block">
              Desired Issue Duration
            </span>
            <div className="space-y-3">
              {[3, 7, 14].map((days) => (
                <label key={days} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    value={days}
                    checked={durationDays === days}
                    onChange={(e) => setDurationDays(parseInt(e.target.value))}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  <span className="text-[var(--text-primary)] font-medium">
                    {days} Days
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    (Due: {toIST(new Date(Date.now() + days * 24 * 60 * 60 * 1000))})
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-4">
              Default is 7 days. Your request must be returned by the due date.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-[#dc3545] border-2 border-[#dc3545] flex gap-3 items-start animate-pulse">
              <AlertCircle size={20} className="text-white flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-semibold">Error</p>
                <p className="text-white text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/student/request')}
              className="flex-1 px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface)] transition-all font-semibold"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
