import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Tab {
  label: string;
  to: string;
}

interface TabsProps {
  tabs: Tab[];
}

export default function Tabs({ tabs }: TabsProps) {
  return (
    <div className="px-12 bg-white border-b border-zinc-100">
      <div className="flex gap-10">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            className={({ isActive }) => cn(
              "pb-4 text-sm font-medium transition-all relative uppercase tracking-widest",
              isActive 
                ? "text-primary font-bold border-b-2 border-primary" 
                : "text-zinc-400 hover:text-primary"
            )}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
