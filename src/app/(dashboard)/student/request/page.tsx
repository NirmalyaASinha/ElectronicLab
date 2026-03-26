'use client';

import { useRouter } from 'next/navigation';
import { useRequestStore } from '@/store/requestStore';
import { PageTransition } from '@/components/dashboard/PageTransition';
import { ClipboardX, Trash, Plus, Minus, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function RequestReview() {
  const router = useRouter();
  const store = useRequestStore();
  const items = store.items || [];

  const handleUpdateQuantity = (componentId: string, qty: number) => {
    if (qty < 1) {
      store.removeItem(componentId);
    } else {
      store.updateQuantity(componentId, qty);
    }
  };

  const handleRemoveItem = (componentId: string) => {
    store.removeItem(componentId);
  };

  const handleProceed = () => {
    if (items.length === 0) {
      alert('Please add components to your request');
      return;
    }
    router.push('/student/request/proceed');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Component Request 📋
          </h1>
          <p className="text-[var(--text-secondary)]">
            Review the components you want to request from the lab
          </p>
        </div>

        {items.length === 0 ? (
          // Empty State
          <div className="p-12 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] border-dashed text-center space-y-4">
            <ClipboardX size={48} className="mx-auto text-[var(--text-secondary)]" />
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                No components added yet
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Browse available components and add them to your request
              </p>
              <button
                onClick={() => router.push('/student/browse')}
                className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold inline-flex items-center gap-2"
              >
                Browse Components
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          // Request Items
          <div className="space-y-6">
            {/* Items Table */}
            <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                        Component
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                        Category
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">
                        Max Days
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {items.map((item) => (
                      <tr key={item.componentId} className="hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[var(--text-secondary)]">{item.category}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.componentId, item.quantity - 1)}
                              className="p-1 rounded hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-secondary)] hover:text-[var(--accent)]"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center font-semibold text-[var(--text-primary)]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.componentId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxQuantity}
                              className="p-1 rounded hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-[var(--text-secondary)]">{item.maxDays} days</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.componentId)}
                            className="p-2 rounded text-[var(--danger)] hover:bg-[var(--danger)] hover:bg-opacity-10 transition-colors"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary and Action Buttons */}
            <div className="space-y-4">
              <div className="p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    Total Components:
                  </p>
                  <p className="text-2xl font-bold text-[var(--accent)]">
                    {store.totalItems()} item{store.totalItems() !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/student/browse')}
                  className="flex-1 px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface)] transition-all font-semibold"
                >
                  Continue Browsing
                </button>
                <button
                  onClick={handleProceed}
                  className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold inline-flex items-center justify-center gap-2"
                >
                  Proceed to Submit
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
