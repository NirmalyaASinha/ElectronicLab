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
      const istTime = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      const hours = String(istTime.getHours()).padStart(2, '0');
      const minutes = String(istTime.getMinutes()).padStart(2, '0');
      const seconds = String(istTime.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
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
