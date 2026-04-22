import React from 'react';
import { Search, ChevronDown, Save, ArrowUpDown } from 'lucide-react';
import Topbar from '../components/Topbar';
import Tabs from '../components/Tabs';
import { MOCK_PRODUCTS } from '../mockData';

const tabs = [
  { label: 'All Products', to: '/products' },
  { label: 'Inventory', to: '/inventory' },
  { label: 'Categories', to: '/categories' },
];

export default function Inventory() {
  return (
    <div className="flex-1">
      <Topbar 
        title="Products" 
        subtitle="Manage your catalog, stock, and categories"
        action={{ label: 'UPDATE ALL', onClick: () => {} }}
      />
      <Tabs tabs={tabs} />

      <div className="p-12 max-w-7xl mx-auto w-full">
        <div className="bg-white border border-zinc-100 shadow-sm rounded-sm overflow-hidden mb-12">
          {/* Inventory Filters */}
          <div className="p-8 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2 border-b-2 border-primary pb-1">
              <span className="serif text-xl text-primary lowercase italic">all variants</span>
              <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">128</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Filter by:</span>
                <div className="flex items-center gap-1 cursor-pointer group">
                  <span className="text-xs font-bold text-primary group-hover:underline">Category</span>
                  <ChevronDown size={14} className="text-zinc-400" />
                </div>
              </div>

              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" />
                <input 
                  type="text" 
                  placeholder="Search variant name..."
                  className="pl-10 pr-4 py-2 bg-zinc-50/50 border border-zinc-100 focus:bg-white focus:ring-1 focus:ring-primary text-xs w-64 rounded-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/30">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans border-b border-zinc-100">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                    Variant
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans border-b border-zinc-100 text-center">SKU</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans border-b border-zinc-100 text-center">In Stock</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans border-b border-zinc-100 text-center">Price</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans border-b border-zinc-100 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {MOCK_PRODUCTS.flatMap(p => p.variants.length > 0 ? p.variants.map(v => ({ ...v, productName: p.name, productImage: p.image })) : []).map((variant, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-100 overflow-hidden rounded-sm border border-zinc-100">
                        <img 
                          src={variant.productImage} 
                          alt={variant.productName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="serif text-sm text-primary leading-tight">{variant.productName}</p>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-tight">{variant.color} · Size {variant.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center tabular-nums text-xs font-medium text-zinc-500">{variant.sku}</td>
                  <td className="px-8 py-6 text-center">
                    <input 
                      type="number" 
                      defaultValue={variant.stock}
                      className="w-20 px-3 py-1.5 border border-zinc-100 bg-zinc-50 focus:bg-white text-xs text-center font-bold text-zinc-900 rounded-sm"
                    />
                  </td>
                  <td className="px-8 py-6 text-center tabular-nums text-xs font-bold text-primary">${variant.price.toFixed(2)}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      variant.status === 'Available' ? "bg-amber-100 text-amber-800" : "bg-red-50 text-red-500"
                    )}>
                      {variant.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* If no variants were found in mock, just show products as single items for demo */}
              {MOCK_PRODUCTS.filter(p => p.variants.length === 0).map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-100 overflow-hidden rounded-sm border border-zinc-100">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="serif text-sm text-primary leading-tight">{p.name}</p>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-tight">Classic Cut · One Size</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center tabular-nums text-xs font-medium text-zinc-500">{p.sku}</td>
                  <td className="px-8 py-6 text-center">
                    <input 
                      type="number" 
                      defaultValue={p.stock}
                      className="w-20 px-3 py-1.5 border border-zinc-100 bg-zinc-50 focus:bg-white text-xs text-center font-bold text-zinc-900 rounded-sm"
                    />
                  </td>
                  <td className="px-8 py-6 text-center tabular-nums text-xs font-bold text-primary">${p.price.toFixed(2)}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      p.stock > 10 ? "bg-amber-100 text-amber-800" : (p.stock > 0 ? "bg-zinc-100 text-zinc-500" : "bg-red-50 text-red-500")
                    )}>
                      {p.stock > 10 ? 'Available' : (p.stock > 0 ? 'Low Stock' : 'Out of Stock')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-8 bg-zinc-50/50 flex items-center justify-between">
            <p className="text-xs text-zinc-400 italic">Inventory levels are synced across all your sales channels.</p>
            <button className="bg-primary text-white px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-primary-dim transition-all active:scale-95 flex items-center gap-2">
              <Save size={16} />
              Save Changes
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
