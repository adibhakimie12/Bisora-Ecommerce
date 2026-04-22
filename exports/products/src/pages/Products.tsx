import React from 'react';
import { MoreHorizontal, Plus, Search, Filter } from 'lucide-react';
import Topbar from '../components/Topbar';
import Tabs from '../components/Tabs';
import { MOCK_PRODUCTS } from '../mockData';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { label: 'All Products', to: '/products' },
  { label: 'Inventory', to: '/inventory' },
  { label: 'Categories', to: '/categories' },
];

export default function Products() {
  const navigate = useNavigate();

  return (
    <div className="flex-1">
      <Topbar 
        title="Products" 
        subtitle="Manage your catalog, stock, and categories"
        action={{ label: 'ADD PRODUCT', onClick: () => {} }}
      />
      <Tabs tabs={tabs} />

      <div className="p-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex gap-6 overflow-x-auto no-scrollbar py-1">
            <button className="text-xs font-bold text-primary tracking-widest uppercase border-b-2 border-primary pb-1">All</button>
            <button className="text-xs font-medium text-zinc-400 hover:text-primary transition-colors tracking-widest uppercase pb-1">Active</button>
            <button className="text-xs font-medium text-zinc-400 hover:text-primary transition-colors tracking-widest uppercase pb-1">Unpublished</button>
            <button className="text-xs font-medium text-zinc-400 hover:text-primary transition-colors tracking-widest uppercase pb-1">Hidden</button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-zinc-100 mt-2">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Stock:</span>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-bold tracking-widest uppercase shadow-sm">All Stock</button>
                <button className="px-4 py-1.5 rounded-full bg-white text-zinc-500 border border-zinc-100 hover:border-primary/20 text-[10px] font-bold tracking-widest uppercase transition-all">Low Stock</button>
                <button className="px-4 py-1.5 rounded-full bg-white text-zinc-500 border border-zinc-100 hover:border-primary/20 text-[10px] font-bold tracking-widest uppercase transition-all">Out of Stock</button>
              </div>
            </div>

            <div className="relative flex-1 max-w-xs">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" />
              <input 
                type="text" 
                placeholder="Search product name..."
                className="w-full pl-10 pr-4 py-2 bg-white border-zinc-100 focus:ring-1 focus:ring-primary text-xs rounded-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-zinc-100 rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Product</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 tracking-widest uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {MOCK_PRODUCTS.map((product) => (
                <tr 
                  key={product.id} 
                  className="transition-colors group hover:bg-zinc-50/50 cursor-pointer"
                  onClick={() => navigate(`/products/edit/${product.id}`)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-zinc-100 overflow-hidden rounded-sm">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="serif text-base font-normal text-primary mb-1">{product.name}</div>
                        <div className="text-[10px] text-zinc-400 tracking-wider font-semibold uppercase">SKU: {product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-zinc-600 font-medium">{product.category}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="serif text-sm font-semibold text-primary">${product.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-sm",
                      product.stock === 0 ? "text-red-500 font-medium italic" : "text-zinc-600"
                    )}>
                      {product.stock === 0 ? 'Discontinued' : `${product.stock} in stock`}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2 py-1 rounded-sm text-[10px] font-bold tracking-widest uppercase",
                      product.status === 'ACTIVE' ? "bg-amber-100 text-amber-800" : "bg-zinc-200 text-zinc-600"
                    )}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-zinc-400 hover:text-primary transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-[10px] text-zinc-400 tracking-widest uppercase font-semibold">Showing 5 of 124 Products</p>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center border border-zinc-200 hover:bg-zinc-100 transition-colors">
              <Search size={16} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center bg-primary text-white text-xs font-bold">1</button>
            <button className="w-10 h-10 flex items-center justify-center border border-zinc-200 hover:bg-zinc-100 transition-colors text-xs font-bold">2</button>
            <button className="w-10 h-10 flex items-center justify-center border border-zinc-200 hover:bg-zinc-100 transition-colors text-xs font-bold">3</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
