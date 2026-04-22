import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Trash2, Tag, LayoutGrid, Info, ArrowRight, Plus } from 'lucide-react';
import { MOCK_PRODUCTS } from '../mockData';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0];

  return (
    <div className="flex-1 bg-surface pb-20">
      <div className="px-12 py-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/products')}
            className="w-10 h-10 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-primary transition-colors bg-white shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="serif text-2xl text-primary font-bold line-clamp-1">{product.name}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">SKU: {product.sku}</span>
               <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
               <span className="text-[10px] uppercase font-bold text-amber-600 tracking-widest">{product.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-zinc-400 text-xs font-bold uppercase tracking-widest px-6 py-2.5 hover:text-red-500 transition-colors">
            Archive
          </button>
          <button className="bg-primary text-white px-10 py-3 text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-3 active:scale-95">
            <Save size={16} />
            Save Details
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Visuals & Core Info */}
        <div className="lg:col-span-8 space-y-12">
          <section className="bg-white p-10 border border-zinc-100 rounded-sm shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <h3 className="serif text-2xl text-primary italic lowercase">Visual Assets</h3>
              <Info size={14} className="text-zinc-300" />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2 aspect-[3/4] bg-zinc-50 border border-zinc-100 relative group overflow-hidden cursor-zoom-in">
                <img 
                  src={product.image} 
                  alt="Main Visual" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-primary text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1">Main Cover</span>
                </div>
              </div>
              
              <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-4">
                {[1, 2, 3].map((i) => (
                   <div key={i} className="aspect-[3/4] bg-zinc-50 border border-zinc-100 flex items-center justify-center relative overflow-hidden group">
                      <img 
                        src={`https://images.unsplash.com/photo-1518173946687-a4c8a9ba332f?auto=format&fit=crop&q=80&w=200&seed=${i}`} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700 hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                   </div>
                ))}
                <div className="aspect-[3/4] border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-colors">
                  <LayoutGrid size={20} className="text-zinc-200 mb-2" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Add more</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-10 border border-zinc-100 rounded-sm shadow-sm space-y-8">
            <h3 className="serif text-2xl text-primary lowercase italic border-b border-zinc-50 pb-4">Production Variants</h3>
            
            <div className="space-y-6">
              {product.variants.length > 0 ? (
                product.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between p-6 bg-surface-container rounded-sm border border-zinc-100 group hover:border-primary/20 transition-all">
                    <div className="flex gap-10">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Variant Color</p>
                        <p className="text-sm font-semibold text-zinc-900">{variant.color}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Size</p>
                        <p className="text-sm font-semibold text-zinc-900">{variant.size}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Internal SKU</p>
                        <p className="text-sm font-semibold text-zinc-500 tabular-nums">{variant.sku}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                         <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Available Stock</p>
                         <input 
                           type="number" 
                           defaultValue={variant.stock}
                           className="w-16 bg-white border border-zinc-200 text-xs font-bold p-1 text-center focus:ring-1 focus:ring-primary outline-none"
                         />
                       </div>
                       <button className="text-zinc-300 hover:text-zinc-900 transition-colors">
                         <ArrowRight size={20} />
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-zinc-100">
                  <p className="text-sm text-zinc-400 italic">This product does not have variants. Manage pricing and stock globally.</p>
                </div>
              )}
            </div>
            
            <button className="w-full py-4 border border-zinc-100 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 hover:border-primary/30 hover:text-primary transition-all">
               Manage Global Variants
            </button>
          </section>
        </div>

        {/* Right Column: Meta & Organisation */}
        <div className="lg:col-span-4 space-y-12">
          <section className="bg-white p-8 border border-zinc-100 rounded-sm shadow-sm space-y-8">
            <div>
              <h3 className="serif text-lg text-primary lowercase italic border-b border-zinc-100 pb-2 mb-6">Organisation</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Primary Category</label>
                  <select className="w-full p-3 bg-zinc-50 border-none text-xs font-medium text-zinc-600 focus:ring-1 focus:ring-primary outline-none appearance-none">
                    <option>{product.category}</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Marketing Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                      <span key={tag} className="bg-primary/5 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-primary/10">
                        {tag}
                        <Trash2 size={10} className="cursor-pointer hover:text-red-500" />
                      </span>
                    ))}
                    <button className="w-8 h-8 rounded-full border border-zinc-200 border-dashed flex items-center justify-center text-zinc-300 hover:text-primary transition-colors">
                       <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-50">
               <h3 className="serif text-lg text-primary lowercase italic border-b border-zinc-100 pb-2 mb-6">Price & Logistics</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Unit Price</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                        <input 
                          type="text" 
                          defaultValue={product.price}
                          className="w-full pl-8 pr-4 py-3 bg-zinc-50 border-none text-sm font-bold text-zinc-900 focus:ring-1 focus:ring-primary outline-none"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Compare at</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 font-bold text-xs">$</span>
                        <input 
                          type="text" 
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 bg-zinc-50/30 border-none text-sm font-medium text-zinc-300 focus:ring-1 focus:ring-primary outline-none"
                        />
                     </div>
                  </div>
               </div>
            </div>
          </section>

          <section className="bg-primary/5 p-8 rounded-sm border border-primary/10 space-y-4">
             <div className="flex items-center gap-3 mb-2">
                <Tag size={18} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Smart Inventory</span>
             </div>
             <p className="text-xs text-zinc-600 leading-relaxed">
               Based on current analytics, this product is in <strong>High Demand</strong>. Consider replenishing stock for the upcoming Eid season.
             </p>
             <button className="w-full mt-2 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest shadow-md">
               Review Analytics
             </button>
          </section>
        </div>
      </div>
    </div>
  );
}
