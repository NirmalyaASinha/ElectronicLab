'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/dashboard/PageTransition';
import { useRequest } from '@/contexts/RequestContext';
import { ArrowLeft, Calendar } from 'lucide-react';

interface Faculty {
  id: string;
  name: string;
  department: string;
}

interface ComponentWithDeadline {
  componentId: string;
  name: string;
  quantity: number;
  daysAllowed: number;
}

export const dynamic = 'force-dynamic';

export default function ProceedRequest() {
  const router = useRouter();
  const { data: session } = useSession();
  const { cartItems, clearCart } = useRequest();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [components, setComponents] = useState<ComponentWithDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [purpose, setPurpose] = useState('');

  const fetchFaculties = async () => {
    try {
      const res = await fetch('/api/faculty');
      const data = await res.json();
      if (data.data) {
        setFaculties(data.data);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareComponents = useCallback(() => {
    const prepared = cartItems.map((item) => ({
      componentId: item.id,
      name: item.name,
      quantity: item.quantityRequested,
      daysAllowed: 14, // Default 14 days
    }));
    setComponents(prepared);
  }, [cartItems]);

  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/student/request');
      return;
    }
    fetchFaculties();
    prepareComponents();
  }, [cartItems, prepareComponents, router]);

  const updateComponentDeadline = (componentId: string, days: number) => {
    setComponents((prev) =>
      prev.map((comp) =>
        comp.componentId === componentId ? { ...comp, daysAllowed: days } : comp
      )
    );
  };

  const handleSubmit = async () => {
    if (!selectedFaculty) {
      alert('Please select a faculty member');
      return;
    }

    if (!purpose.trim()) {
      alert('Please provide a purpose for the request');
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        studentId: session?.user?.id,
        facultyId: selectedFaculty,
        purpose,
        items: components.map((comp) => ({
          componentId: comp.componentId,
          quantity: comp.quantity,
          issueDeadlineDays: comp.daysAllowed,
        })),
      };

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (res.ok) {
        clearCart();
        
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
        `;
        notification.textContent = '✓ Request submitted successfully!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transition = 'opacity 0.3s ease';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        setTimeout(() => router.push('/student/requests'), 500);
      } else {
        const error = await res.json();
        
        // Show error notification
        const errorNotif = document.createElement('div');
        errorNotif.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 16px;
          backgroundColor: #ef4444;
          color: white;
          borderRadius: 6px;
          fontSize: 13px;
          fontWeight: 500;
          boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          zIndex: 9999;
        `;
        errorNotif.textContent = `✕ ${error.message || 'Failed to submit request'}`;
        document.body.appendChild(errorNotif);
        
        setTimeout(() => {
          errorNotif.style.opacity = '0';
          errorNotif.style.transition = 'opacity 0.3s ease';
          setTimeout(() => errorNotif.remove(), 300);
        }, 4000);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      
      // Show error notification
      const errorNotif = document.createElement('div');
      errorNotif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        backgroundColor: #ef4444;
        color: white;
        borderRadius: 6px;
        fontSize: 13px;
        fontWeight: 500;
        boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        zIndex: 9999;
      `;
      errorNotif.textContent = '✕ An error occurred while submitting your request';
      document.body.appendChild(errorNotif);
      
      setTimeout(() => {
        errorNotif.style.opacity = '0';
        errorNotif.style.transition = 'opacity 0.3s ease';
        setTimeout(() => errorNotif.remove(), 300);
      }, 4000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">
              Confirm Your Request ✅
            </h1>
            <p className="text-[var(--text-secondary)]">
              Review details and submit your component request
            </p>
          </div>
        </div>

        {/* Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select Faculty */}
            <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Select Faculty 👨‍🏫
              </h2>
              {faculties.length === 0 ? (
                <p className="text-[var(--text-secondary)]">No faculty members available</p>
              ) : (
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">Choose a faculty member...</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} ({faculty.department})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Purpose */}
            <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Purpose of Request 📝
              </h2>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe why you need these components..."
                rows={4}
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            {/* Components & Deadlines */}
            <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Components & Deadlines ⏰
              </h2>
              <StaggerContainer staggerDelay={0.05}>
                <div className="space-y-4">
                  {components.map((component) => (
                    <StaggerItem key={component.componentId}>
                      <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-[var(--text-primary)]">
                              {component.name}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Qty: {component.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-[var(--accent)]" />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="90"
                              value={component.daysAllowed}
                              onChange={(e) =>
                                updateComponentDeadline(
                                  component.componentId,
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-16 px-2 py-1 bg-[var(--bg-base)] border border-[var(--border)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                            <span className="text-[var(--text-secondary)]">days to return</span>
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerContainer>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 p-6 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-4">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Summary 📋
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[var(--text-muted)]">Components</p>
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    {components.length}
                  </p>
                </div>

                <div>
                  <p className="text-[var(--text-muted)]">Total Items</p>
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    {components.reduce((sum, c) => sum + c.quantity, 0)}
                  </p>
                </div>

                <div>
                  <p className="text-[var(--text-muted)]">Selected Faculty</p>
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    {selectedFaculty
                      ? faculties.find((f) => f.id === selectedFaculty)?.name || 'Selecting...'
                      : 'Not selected'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border)]">
                  <p className="text-[var(--text-muted)] mb-2">Purpose Provided</p>
                  <p
                    className={`text-sm ${
                      purpose.trim()
                        ? 'text-[var(--success)]'
                        : 'text-[var(--danger)]'
                    }`}
                  >
                    {purpose.trim() ? '✓ Yes' : '✗ Required'}
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedFaculty || !purpose.trim()}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-all text-lg ${
                    submitting || !selectedFaculty || !purpose.trim()
                      ? 'bg-[var(--text-muted)] text-[var(--text-secondary)] cursor-not-allowed'
                      : 'bg-[var(--accent)] text-white hover:bg-opacity-90'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  onClick={() => router.push('/student/requests')}
                  className="w-full px-6 py-3 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:border-[var(--accent)] transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
