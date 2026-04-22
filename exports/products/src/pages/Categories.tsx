import React from 'react';
import { ChevronRight, Search } from 'lucide-react';
import Topbar from '../components/Topbar';
import Tabs from '../components/Tabs';
import { MOCK_CATEGORIES } from '../mockData';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { label: 'All Products', to: '/products' },
  { label: 'Inventory', to: '/inventory' },
  { label: 'Categories', to: '/categories' },
];

export default function Categories() {
  const navigate = useNavigate();

  return (
    <div className="flex-1">
      <Topbar 
        title="Products" 
        subtitle="Manage your catalog, stock, and categories"
        action={{ label: 'CREATE CATEGORY', onClick: () => {} }}
      />
      <Tabs tabs={tabs} />

      <div className="p-12 max-w-7xl mx-auto w-full space-y-12">
        {/* Category Overview Bento-lite */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 flex flex-col justify-between min-h-[160px] border border-zinc-100 rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Categories</span>
            <div className="flex items-baseline gap-2">
              <span className="serif text-5xl text-primary">12</span>
              <span className="text-xs text-zinc-400 font-medium tracking-tight">Active Collections</span>
            </div>
          </div>
          
          <div className="bg-surface-container p-8 flex flex-col justify-between min-h-[160px] rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Catalog Health</span>
            <div>
              <div className="serif text-4xl text-zinc-900">98%</div>
              <div className="w-full bg-zinc-200 h-[2px] mt-4 overflow-hidden">
                <div className="bg-primary h-full w-[98%]"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 flex flex-col justify-between min-h-[160px] border border-zinc-100 rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Top Performing</span>
            <div className="serif text-xl font-medium text-zinc-900 italic">"Abayas & Modest Wear"</div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white overflow-hidden shadow-sm border border-zinc-100 rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 font-sans border-b border-zinc-100">Category Name</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 font-sans border-b border-zinc-100">Products</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 font-sans border-b border-zinc-100 text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 font-sans border-b border-zinc-100">Last Updated</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 font-sans border-b border-zinc-100 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {MOCK_CATEGORIES.map((category) => (
                <tr 
                  key={category.id} 
                  className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/categories/edit/${category.id}`)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-zinc-100 overflow-hidden rounded-sm">
                        <img 
                          src={category.image} 
                          alt={category.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="serif text-lg text-primary">{category.name}</p>
                        <p className="text-[11px] text-zinc-400">{category.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="serif text-lg text-zinc-600">{category.productCount}</span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-tighter ml-1">Items</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                      category.status === 'PUBLISHED' ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-400"
                    )}>
                      <span className={cn("w-1 h-1 rounded-full", category.status === 'PUBLISHED' ? "bg-amber-800" : "bg-zinc-400")}></span>
                      {category.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-zinc-600 font-medium">{category.lastUpdated}</p>
                    <p className="text-[10px] text-zinc-400">{category.lastUpdatedTime}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <ChevronRight size={20} className="text-zinc-300 group-hover:text-primary transition-colors inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="px-8 py-8 flex items-center justify-between border-t border-zinc-100">
            <p className="text-xs text-zinc-400 font-medium">Showing 1 to 4 of 12 categories</p>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center bg-primary text-white text-xs font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 text-xs font-bold transition-colors">2</button>
              <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 text-xs font-bold transition-colors">3</button>
            </div>
          </div>
        </div>

        {/* Contextual Pro Tip */}
        <div className="bg-primary p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 rounded-sm shadow-xl">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 mix-blend-overlay">
            <img 
              src="https://images.unsplash.com/photo-1518173946687-a4c8a9ba332f?auto=format&fit=crop&q=80&w=600" 
              alt="Tip Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 space-y-4 z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Pro Tip</span>
            <h3 className="serif text-3xl text-white leading-tight max-w-md">Optimize your categories for editorial discovery.</h3>
            <p className="text-white/70 text-sm max-w-sm leading-relaxed">Consider grouping products by "Collections" to create a more narrative shopping experience for your clientele.</p>
          </div>
          <div className="z-10">
            <button className="border border-white/20 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
