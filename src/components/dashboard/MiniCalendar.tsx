'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MiniCalendarProps {
  dueDates?: Date[];
}

export function MiniCalendar({ dueDates = [] }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isDueDate = (day: number) => {
    return dueDates.some(
      (date) =>
        date.getDate() === day &&
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()
    );
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  if (!mounted) return null;

  return (
    <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--text-primary)]">{monthName}</h3>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} className="text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-xs font-medium text-[var(--text-secondary)]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <motion.div
            key={index}
            whileHover={day ? { scale: 1.05 } : {}}
            className={`aspect-square flex items-center justify-center text-sm rounded relative group ${
              day === null
                ? ''
                : isToday(day)
                  ? 'bg-[var(--accent)] text-white font-semibold'
                  : isDueDate(day)
                    ? 'bg-[var(--warning)] text-[var(--bg-base)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] cursor-pointer'
            }`}
          >
            {day}
            {day && isDueDate(day) && !isToday(day) && (
              <div className="absolute bottom-0 w-1 h-1 bg-[var(--danger)] rounded-full" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)] text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <span className="text-[var(--text-secondary)]">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--warning)]" />
          <span className="text-[var(--text-secondary)]">Due Date</span>
        </div>
      </div>
    </div>
  );
}
