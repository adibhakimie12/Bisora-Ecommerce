import React from 'react';
import { Search, Bell, HelpCircle, Plus } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <header className="sticky top-0 right-0 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100 flex justify-between items-center px-12 py-6 z-40">
      <div className="flex flex-col">
        <h2 className="text-3xl serif font-bold text-primary leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search inventory..."
            className="pl-10 pr-4 py-2 bg-zinc-50 border-none focus:ring-1 focus:ring-primary text-sm w-64 transition-all duration-300"
          />
        </div>

        <div className="flex items-center gap-4 text-zinc-400">
          <button className="hover:text-primary transition-colors">
            <Bell size={20} />
          </button>
          <button className="hover:text-primary transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>

        {action && (
          <button 
            onClick={action.onClick}
            className="bg-primary text-white px-6 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-primary-dim transition-all active:scale-95 shadow-sm"
          >
            <Plus size={18} />
            {action.label}
          </button>
        )}
      </div>
    </header>
  );
}
