import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Box, Users, Megaphone, BarChart3, Settings, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: ShoppingBag, label: 'Orders', to: '/orders' },
  { icon: Box, label: 'Products', to: '/products' },
  { icon: Users, label: 'Customers', to: '/customers' },
  { icon: Megaphone, label: 'Marketing', to: '/marketing' },
  { icon: BarChart3, label: 'Reports', to: '/reports' },
  { icon: Settings, label: 'Settings', to: '/settings' },
  { icon: Globe, label: 'Website Builder', to: '/website' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-zinc-200 bg-surface-container py-8 z-50">
      <div className="px-8 mb-12">
        <h1 className="serif italic text-2xl text-primary font-bold">Atelier Admin</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mt-1">Luxury Suite</p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-8 py-3 transition-all duration-300",
              isActive 
                ? "bg-white text-primary border-r-2 border-primary font-bold" 
                : "text-zinc-500 hover:text-primary hover:bg-white/50"
            )}
          >
            <item.icon size={20} />
            <span className="text-sm font-medium tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-8 mt-auto pt-8">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
          <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" 
              alt="Admin Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-zinc-900 truncate">Admin Profile</p>
            <p className="text-[10px] text-zinc-400">Store Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
