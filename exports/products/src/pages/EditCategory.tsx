import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Image as ImageIcon, Save, Trash2, Plus, GripVertical } from 'lucide-react';
import Topbar from '../components/Topbar';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../mockData';

export default function EditCategory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const category = MOCK_CATEGORIES.find(c => c.id === id) || MOCK_CATEGORIES[0];

  return (
    <div className="flex-1 bg-surface pb-20">
      <div className="px-12 py-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/categories')}
            className="w-10 h-10 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-primary transition-colors bg-white shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="serif text-2xl text-primary font-bold">{category.name}</h2>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mt-0.5">Edit Collection Detail</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-4 py-2 hover:bg-red-50 transition-colors">
            <Trash2 size={16} />
            Discard
          </button>
          <button className="bg-primary text-white px-8 py-3 text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
            <Save size={16} />
            Publish Changes
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="serif text-xl text-primary">General Information</h3>
                <div title="General collection details visible to customers">
                  <Info size={14} className="text-zinc-300" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Category Name</label>
                  <input 
                    type="text" 
                    defaultValue={category.name}
                    className="w-full px-5 py-4 bg-white border border-zinc-100 text-zinc-900 serif text-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="e.g. Modest Outerwear"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Description</label>
                  <textarea 
                    rows={6}
                    defaultValue={category.description}
                    className="w-full px-5 py-4 bg-white border border-zinc-100 text-sm text-zinc-600 leading-relaxed focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                    placeholder="Describe the aesthetic and philosophy of this collection..."
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="serif text-xl text-primary lowercase italic">products in category</h3>
                <button className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase hover:underline flex items-center gap-1">
                  <Plus size={14} /> Add Product
                </button>
              </div>

              <div className="bg-white border border-zinc-100 rounded-sm divide-y divide-zinc-50 overflow-hidden">
                {MOCK_PRODUCTS.slice(0, 4).map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50/50 transition-colors group">
                    <div className="text-zinc-300 cursor-grab active:cursor-grabbing">
                      <GripVertical size={18} />
                    </div>
                    <div className="w-12 h-16 bg-zinc-100 overflow-hidden flex-shrink-0">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-zinc-900 truncate tracking-tight">{p.name}</p>
                      <p className="text-[10px] text-zinc-400 capitalize">{p.sku} · {p.stock} in stock</p>
                    </div>
                    <button className="p-2 text-zinc-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-12">
            <section className="space-y-6">
              <h3 className="serif text-lg text-primary lowercase italic border-b border-zinc-100 pb-2">Status</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Published</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed italic">When published, this collection will be live on your storefront catalog across all devices.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="serif text-lg text-primary lowercase italic border-b border-zinc-100 pb-2">Featured Image</h3>
              <div className="aspect-[3/4] bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center relative group overflow-hidden cursor-pointer rounded-sm">
                {category.image ? (
                  <>
                    <img 
                      src={category.image} 
                      alt="Category Preview" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-2">
                       <ImageIcon size={24} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-300 flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center bg-white shadow-sm">
                      <ImageIcon size={20} className="text-zinc-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Click to upload</p>
                      <p className="text-[8px] text-zinc-300 uppercase mt-1">Recommended: 1200 x 1600px</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
