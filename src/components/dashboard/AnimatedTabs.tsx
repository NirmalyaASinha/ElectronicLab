'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function AnimatedTabs({ tabs, defaultTab }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [underlineLeft, setUnderlineLeft] = useState(0);
  const underlineRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const activeButtonRef = tabRefs.current[activeTab];
    if (activeButtonRef && underlineRef.current) {
      setUnderlineWidth(activeButtonRef.offsetWidth);
      setUnderlineLeft(activeButtonRef.offsetLeft);
    }
  }, [activeTab]);

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="w-full">
      <div className="relative flex border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current[tab.id] = el;
            }}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm transition-colors duration-200 relative ${
              activeTab === tab.id
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <motion.div
          ref={underlineRef}
          className="absolute bottom-0 h-[2px] bg-[var(--accent)]"
          initial={false}
          animate={{
            width: underlineWidth,
            left: underlineLeft,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="py-6"
      >
        {activeTabContent}
      </motion.div>
    </div>
  );
}
