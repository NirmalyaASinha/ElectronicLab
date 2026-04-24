'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export function LiveClock() {
  const [time, setTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateTime = () => {
      const now = new Date();
      // Use toLocaleTimeString with timeZone for robust IST time
      const istTimeString = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setTime(istTimeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
        <Clock size={20} className="text-[var(--accent)]" />
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Current Time (IST)</p>
          <p className="text-lg font-mono font-semibold text-[var(--text-primary)]">--:--:--</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
      <Clock size={20} className="text-[var(--accent)]" />
      <div>
        <p className="text-xs text-[var(--text-secondary)]">Current Time (IST)</p>
        <p className="text-lg font-mono font-semibold text-[var(--text-primary)]">{time}</p>
      </div>
    </div>
  );
}
