'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DetailSheet from '@/components/shared/DetailSheet';

interface LegacyDueDateProp {
  dueDates?: Date[];
}

interface DueDateEntry {
  date: string;
  requestId: string;
  label: string;
  isOverdue: boolean;
  status: string;
  purpose: string;
  studentName?: string;
  items: Array<{
    id: string;
    componentId: string;
    name: string;
    category: string;
    quantity: number;
  }>;
}

interface DueDatesApiResponse {
  success: boolean;
  data?: DueDateEntry[];
}

const getDateKey = (date: Date) => date.toISOString().split('T')[0];

export function MiniCalendar({ dueDates = [] }: LegacyDueDateProp) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<DueDateEntry[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DueDateEntry | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadDueDates = async () => {
      try {
        const response = await fetch('/api/calendar/due-dates', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = (await response.json()) as DueDatesApiResponse;

        if (data.success && data.data) {
          setEntries(data.data);
          return;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
      }

      setEntries(
        dueDates.map((date, index) => ({
          date: getDateKey(date),
          requestId: `legacy-${index}`,
          label: 'Due item',
          isOverdue: date.getTime() < Date.now(),
          status: 'ISSUED',
          purpose: 'Tracked due date',
          items: [],
        }))
      );
    };

    void loadDueDates();

    return () => controller.abort();
  }, [dueDates]);

  const groupedEntries = useMemo(() => {
    const grouped = new Map<string, DueDateEntry[]>();

    entries.forEach((entry) => {
      const existing = grouped.get(entry.date) ?? [];
      existing.push(entry);
      grouped.set(entry.date, existing);
    });

    return grouped;
  }, [entries]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const selectedDateEntries = selectedDateKey ? groupedEntries.get(selectedDateKey) ?? [] : [];

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getDayEntries = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return groupedEntries.get(getDateKey(date)) ?? [];
  };

  const prevMonth = () => {
    setSelectedDateKey(null);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedDateKey(null);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days: Array<number | null> = [];

  for (let index = 0; index < firstDay; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day);
  }

  return (
    <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">{monthName}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Real due dates from active issue requests</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} className="text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={14} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} className="text-xs font-medium text-[var(--text-secondary)]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-12 rounded-md" />;
          }

          const dayEntries = getDayEntries(day);
          const overdueCount = dayEntries.filter((entry) => entry.isOverdue).length;
          const dueCount = dayEntries.length;
          const dateKey = getDateKey(
            new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
          );
          const isSelected = selectedDateKey === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setSelectedDateKey(dueCount > 0 ? dateKey : null)}
              style={{
                height: '48px',
                borderRadius: '12px',
                border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                backgroundColor: isToday(day)
                  ? 'var(--accent)'
                  : isSelected
                    ? 'var(--accent-light)'
                    : 'transparent',
                color: isToday(day) ? 'white' : 'var(--text-primary)',
                position: 'relative',
                cursor: dueCount > 0 ? 'pointer' : 'default',
              }}
            >
              <span className="text-xs font-semibold">{day}</span>
              {dueCount > 0 ? (
                <>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: overdueCount > 0 ? 'var(--danger)' : 'var(--warning)',
                    }}
                  />
                  {dueCount > 1 ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '999px',
                        backgroundColor: overdueCount > 0 ? 'var(--danger)' : 'var(--warning)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                      }}
                    >
                      {dueCount}
                    </span>
                  ) : null}
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <span className="text-[var(--text-secondary)]">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--warning)]" />
          <span className="text-[var(--text-secondary)]">Due date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--danger)]" />
          <span className="text-[var(--text-secondary)]">Overdue</span>
        </div>
      </div>

      {selectedDateEntries.length > 0 ? (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Due on {selectedDateKey}
          </div>
          <div className="space-y-3">
            {selectedDateEntries.map((entry) => (
              <div
                key={entry.requestId}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {entry.studentName ? `${entry.studentName} • ` : ''}
                      {entry.label}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">{entry.purpose}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-2">
                      {entry.items.map((item) => `${item.name} (${item.quantity})`).join(', ')}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: entry.isOverdue ? 'var(--danger-light)' : 'var(--warning-light)',
                      color: entry.isOverdue ? 'var(--danger)' : 'var(--warning)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.isOverdue ? 'OVERDUE' : entry.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEntry(entry)}
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <DetailSheet
        open={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        title="Request Details"
        subtitle={selectedEntry?.studentName ?? selectedEntry?.date}
      >
        {selectedEntry ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Purpose
              </div>
              <p style={{ margin: '8px 0 0', color: 'var(--text-primary)', fontSize: '14px' }}>
                {selectedEntry.purpose}
              </p>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Due Date
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedEntry.date}
                  </div>
                </div>
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    backgroundColor: selectedEntry.isOverdue ? 'var(--danger-light)' : 'var(--warning-light)',
                    color: selectedEntry.isOverdue ? 'var(--danger)' : 'var(--warning)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {selectedEntry.isOverdue ? 'OVERDUE' : selectedEntry.status}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedEntry.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-elevated)',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {item.category} • Qty {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DetailSheet>
    </div>
  );
}
