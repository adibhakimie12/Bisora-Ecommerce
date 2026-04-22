import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Monitor, 
  Smartphone, 
  Settings, 
  Layers, 
  Image as ImageIcon, 
  Type, 
  MoveUp, 
  MoveDown, 
  Trash2, 
  Eye, 
  X
} from 'lucide-react';

// --- Types ---
type SectionType = 'hero' | 'gallery' | 'editorial' | 'product-highlight' | 'spacer' | 'footer' | 'text-marquee';

interface Section {
  id: string;
  type: SectionType;
  content: any;
  settings: {
    paddingTop: string;
    paddingBottom: string;
    backgroundColor: string;
  };
}

type Device = 'desktop' | 'mobile';

// --- Components ---

const Header = ({ device, setDevice, isSaving, onSave }: { device: Device, setDevice: (d: Device) => void, isSaving: boolean, onSave: () => void }) => (
  <header className="h-14 border-b border-brand-stone bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-brand-charcoal flex items-center justify-center text-white font-serif text-lg italic rounded-sm transition-transform hover:rotate-6">A</div>
      <span className="font-serif text-lg tracking-tight hidden sm:inline">Atelier Builder</span>
    </div>
    
    <div className="flex items-center bg-brand-stone/50 p-1 rounded-full border border-brand-stone">
      <button 
        onClick={() => setDevice('desktop')}
        className={`p-1.5 rounded-full transition-all ${device === 'desktop' ? 'bg-white shadow-sm text-brand-charcoal' : 'text-brand-moss/60 hover:text-brand-moss'}`}
      >
        <Monitor size={18} />
      </button>
      <button 
        onClick={() => setDevice('mobile')}
        className={`p-1.5 rounded-full transition-all ${device === 'mobile' ? 'bg-white shadow-sm text-brand-charcoal' : 'text-brand-moss/60 hover:text-brand-moss'}`}
      >
        <Smartphone size={18} />
      </button>
    </div>

    <div className="flex items-center gap-3">
      <div className={`text-[10px] uppercase tracking-widest text-brand-moss/40 transition-opacity duration-500 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
        Auto-saving...
      </div>
      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-brand-stone/40 rounded-lg transition-colors">
        <Eye size={16} />
        Preview
      </button>
      <button 
        onClick={onSave}
        disabled={isSaving}
        className="bg-brand-charcoal text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-black transition-all transform active:scale-95 shadow-sm min-w-[100px] flex items-center justify-center"
      >
        {isSaving ? (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Settings size={16} />
          </motion.div>
        ) : 'Publish'}
      </button>
    </div>
  </header>
);

const SidebarLeft = ({ sections, activeId, setActiveId, onAddClick }: { sections: Section[], activeId: string | null, setActiveId: (id: string) => void, onAddClick: () => void }) => (
  <aside className="w-72 border-r border-brand-stone bg-white h-[calc(100vh-3.5rem)] flex flex-col hidden lg:flex">
    <div className="p-4 border-b border-brand-stone flex items-center justify-between">
      <h3 className="font-serif font-medium text-sm">Page Outline</h3>
      <button 
        onClick={onAddClick}
        className="p-1.5 hover:bg-brand-stone/50 rounded-md transition-colors text-brand-charcoal"
      >
        <Plus size={20} />
      </button>
    </div>
    
    <div className="flex-1 overflow-y-auto p-3 space-y-2 hide-scrollbar">
      {sections.map((section, idx) => (
        <motion.div
          key={section.id}
          layout
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setActiveId(section.id)}
          className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
            activeId === section.id 
              ? 'bg-brand-sand border-brand-moss ring-1 ring-brand-moss/20 shadow-sm' 
              : 'border-transparent hover:border-brand-stone'
          }`}
        >
          <div className="w-6 h-6 rounded bg-brand-stone/30 flex items-center justify-center text-[10px] font-mono text-brand-moss/50 transition-colors group-hover:bg-brand-stone/60">
            {idx + 1}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium capitalize truncate">{section.type.replace('-', ' ')}</p>
            <p className="text-[10px] text-brand-moss/60 truncate italic opacity-0 group-hover:opacity-100 transition-opacity">Custom Settings</p>
          </div>
          <Layers size={14} className={activeId === section.id ? 'text-brand-charcoal' : 'text-brand-stone'} />
        </motion.div>
      ))}
    </div>
    
    <div className="p-4 border-t border-brand-stone">
      <button className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-dashed border-brand-stone text-brand-moss/60 text-sm hover:border-brand-moss/40 hover:text-brand-moss transition-all group">
        <Settings size={16} className="group-hover:rotate-45 transition-transform" />
        Global Styles
      </button>
    </div>
  </aside>
);

// --- Section Library Component ---
const SectionLibrary = ({ onAdd, onClose }: { onAdd: (type: SectionType) => void, onClose: () => void }) => {
  const categories = [
    { title: 'Imagery', types: ['hero', 'gallery', 'product-highlight'] },
    { title: 'Narrative', types: ['editorial', 'text-marquee'] },
    { title: 'Utility', types: ['spacer', 'footer'] }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-charcoal/20 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-brand-stone flex justify-between items-center">
          <div>
            <h2 className="font-serif text-3xl">Visual Library</h2>
            <p className="text-xs text-brand-moss/50 tracking-widest uppercase mt-1">Select an architectural block to append to your collection</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-sand rounded-full transition-colors border border-brand-stone"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {categories.map(cat => (
              <div key={cat.title} className="space-y-6">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-moss/40 border-b border-brand-stone pb-2">{cat.title}</h3>
                <div className="space-y-4">
                  {cat.types.map(type => (
                    <button 
                      key={type}
                      onClick={() => onAdd(type as SectionType)}
                      className="w-full group text-left space-y-3 p-4 rounded-3xl border border-brand-stone hover:border-brand-moss hover:bg-brand-sand transition-all"
                    >
                      <div className="aspect-video bg-brand-stone/40 rounded-xl flex items-center justify-center overflow-hidden border border-brand-stone group-hover:border-brand-moss/20">
                         <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                            {type === 'hero' && <div className="w-16 h-10 border-2 border-brand-moss rounded bg-brand-moss/10 relative"><div className="absolute bottom-2 left-2 w-8 h-1 bg-brand-moss rounded"></div></div>}
                            {type === 'gallery' && <div className="flex gap-1"><div className="w-4 h-6 border-2 border-brand-moss rounded"></div><div className="w-4 h-6 border-2 border-brand-moss rounded"></div><div className="w-4 h-6 border-2 border-brand-moss rounded"></div></div>}
                            {type === 'editorial' && <div className="w-12 h-6 flex flex-col justify-center gap-1"><div className="w-full h-[1px] bg-brand-moss"></div><div className="w-full h-[1px] bg-brand-moss"></div><div className="w-2/3 h-[1px] bg-brand-moss"></div></div>}
                            {type === 'text-marquee' && <div className="w-20 h-4 border border-brand-moss rounded-full flex items-center px-1 overflow-hidden italic font-serif text-[6px]">Moving Narrative ...</div>}
                         </div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="font-serif text-lg capitalize">{type.replace('-', ' ')}</span>
                        <Plus size={16} className="text-brand-moss/20 group-hover:text-brand-moss transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SectionView = ({ section, isMobile }: { section: Section, isMobile: boolean }) => {
  const { type, content } = section;
  
  if (type === 'hero') {
    return (
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden group">
        <img 
          src={content.image || "https://images.unsplash.com/photo-1549174138-f3b48423e0c6?q=80&w=2000"} 
          alt="Fashion Model" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />
        <div className="relative h-full flex flex-col justify-end p-8 lg:p-20 text-white">
          <div className="max-w-4xl overflow-hidden">
            <motion.h1 
              initial={{ y: "100%" }}
              whileInView={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`font-serif tracking-tighter leading-[0.85] mb-6 ${isMobile ? 'text-5xl' : 'text-[clamp(4rem,12vw,14rem)]'}`}
            >
              {content.title || "The Spring Collection"}
            </motion.h1>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end justify-between">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`max-w-xl font-light tracking-wide text-white/80 ${isMobile ? 'text-sm' : 'text-xl font-serif italic'}`}
            >
              {content.subtitle || "A study in form, texture, and the understated elegance of natural movement."}
            </motion.p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              className="px-8 py-3 rounded-full border border-white/30 backdrop-blur shadow-2xl text-xs uppercase tracking-[0.3em] font-bold hover:bg-white hover:text-brand-charcoal transition-all"
            >
              Discovery
            </motion.button>
          </div>
        </div>
      </section>
    );
  }

  if (type === 'gallery') {
    return (
      <section className="py-32 px-6 lg:px-20 bg-white">
        <div className="flex justify-between items-end mb-16 border-b border-brand-stone pb-8">
           <div className="space-y-4">
             <span className="text-[10px] tracking-[0.4em] uppercase text-brand-moss/40 block">Visual Compendium</span>
             <h2 className="font-serif text-5xl lg:text-7xl lowercase italic">the curated series</h2>
           </div>
           <div className="hidden lg:block text-right max-w-xs">
             <p className="text-xs text-brand-moss/60 leading-relaxed italic font-serif">Selected works from the 2024 editorial archives, exploring the intersection of light and shadow.</p>
           </div>
        </div>
        <div className={`grid gap-16 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {[1,2,3].map((i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="space-y-8 cursor-pointer group"
            >
              <div className="overflow-hidden aspect-[3/4.5] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm grayscale hover:grayscale-0 transition-all duration-1000">
                <img 
                  src={`https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&index=${i}`} 
                  className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110"
                  alt="Gallery Item"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-[10px] tracking-widest text-brand-moss/40 uppercase font-bold px-1">
                  <span>Vol. {i}</span>
                  <div className="h-[1px] flex-1 bg-brand-stone" />
                  <span>2024</span>
                </div>
                <h3 className="font-serif text-2xl lg:text-3xl text-brand-moss group-hover:translate-x-2 transition-transform">Symphony in Bone</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  if (type === 'text-marquee') {
    return (
      <div className="py-12 bg-brand-charcoal overflow-hidden whitespace-nowrap border-y border-brand-moss">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="flex items-center gap-12"
        >
          {[1,2,3,4].map(i => (
             <React.Fragment key={i}>
                <span className="font-serif text-6xl lg:text-8xl italic text-brand-sand/10 uppercase tracking-tighter">Artisan Modesty</span>
                <div className="w-8 h-8 rounded-full border border-brand-sand/10" />
                <span className="font-sans text-6xl lg:text-8xl font-thin text-brand-sand/10 uppercase tracking-[0.2em]">The Infinite Collection</span>
                <div className="w-8 h-8 bg-brand-sand/10 rounded-full" />
             </React.Fragment>
          ))}
        </motion.div>
      </div>
    );
  }

  if (type === 'editorial') {
    return (
      <section className="py-40 bg-brand-sand/20">
        <div className={`max-w-6xl mx-auto px-6 grid gap-20 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 items-center'}`}>
           <div className="space-y-8">
             <div className="flex items-center gap-4">
               <div className="w-12 h-[1px] bg-brand-charcoal" />
               <span className="text-[10px] uppercase tracking-widest font-bold">The Manifesto</span>
             </div>
             <h2 className="font-serif text-5xl lg:text-7xl tracking-tighter leading-tight">Quiet luxury is a <span className="italic font-light">deliberate</span> choice.</h2>
             <p className="text-xl lg:text-2xl font-serif text-brand-moss/60 leading-relaxed italic">
               Atelier is founded on the belief that beauty resides in the subtle. Our methodology prioritizes the integrity of raw materials over the noise of contemporary trends.
             </p>
             <button className="text-sm font-bold border-b-2 border-brand-charcoal pb-1 hover:border-brand-stone transition-colors uppercase tracking-widest">Read Translation</button>
           </div>
           <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl relative z-10 translate-x-4 lg:translate-x-12">
                <img src="https://images.unsplash.com/photo-1549416805-4f40d7c07da7?q=80&w=1000" className="w-full h-full object-cover" alt="Editorial" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute -inset-8 bg-brand-stone/30 rounded-[3rem] -z-0 rotate-3" />
           </div>
        </div>
      </section>
    );
  }

  if (type === 'footer') {
    return (
      <footer className="bg-brand-charcoal py-32 px-12 text-brand-sand border-t border-brand-moss">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-20">
          <div className="space-y-8">
            <h2 className="font-serif text-9xl tracking-tighter text-white opacity-20 leading-none">Atelier</h2>
            <div className="flex gap-12 font-sans uppercase text-[10px] tracking-[0.4em] font-bold">
               <a href="#" className="hover:text-white transition-colors">Archive</a>
               <a href="#" className="hover:text-white transition-colors">Contact</a>
               <a href="#" className="hover:text-white transition-colors">Legal</a>
            </div>
          </div>
          <div className="text-right space-y-4">
             <p className="text-xs italic font-serif opacity-40">Hand-finished in Northern Italy. Distributed globally.</p>
             <p className="text-[10px] uppercase tracking-widest opacity-20">&copy; 2024 Atelier Collective. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <div className="h-40 flex items-center justify-center bg-brand-stone/10 border-y border-brand-stone/20">
      <div className="w-[1px] h-20 bg-brand-stone/30" />
    </div>
  );
};

export default function App() {
  const [device, setDevice] = useState<Device>('desktop');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([
    {
      id: 's1',
      type: 'hero',
      content: { 
        title: 'Artisan Modesty', 
        subtitle: 'Exploring the quiet strength of architectural tailoring and breathable linens.' 
      },
      settings: { paddingTop: '0', paddingBottom: '0', backgroundColor: '#ffffff' }
    },
    {
      id: 's-marquee',
      type: 'text-marquee',
      content: {},
      settings: { paddingTop: '0', paddingBottom: '0', backgroundColor: '#1A1A1A' }
    },
    {
      id: 's2',
      type: 'gallery',
      content: {},
      settings: { paddingTop: '80px', paddingBottom: '80px', backgroundColor: '#ffffff' }
    },
    {
      id: 's3',
      type: 'editorial',
      content: {},
      settings: { paddingTop: '100px', paddingBottom: '100px', backgroundColor: '#F7F6F2' }
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const onAddSection = (type: SectionType) => {
    const newId = `s${Date.now()}`;
    const newSection: Section = {
      id: newId,
      type: type,
      content: { 
        title: type === 'text-marquee' ? 'Infinite Narrative' : 'New Story Block',
        subtitle: 'Add a captivating description to tell your brand story.'
      },
      settings: { paddingTop: '80px', paddingBottom: '80px', backgroundColor: '#ffffff' }
    };
    setSections([...sections, newSection]);
    setActiveId(newId);
    setIsLibraryOpen(false);
  };

  const saveWorkspace = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  const deleteSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSections(sections.filter(s => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const moveSection = (id: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const index = sections.findIndex(s => s.id === id);
    if (index < 0) return;
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-moss selection:text-white bg-brand-stone">
      <Header device={device} setDevice={setDevice} isSaving={isSaving} onSave={saveWorkspace} />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Structure Sidebar */}
        <SidebarLeft 
          sections={sections} 
          activeId={activeId} 
          setActiveId={setActiveId} 
          onAddClick={() => setIsLibraryOpen(true)}
        />
        
        {/* Canvas Area */}
        <div className="flex-1 bg-brand-stone/30 flex flex-col items-center p-4 lg:p-12 overflow-y-auto overflow-x-hidden hide-scrollbar scroll-smooth">
          <motion.div 
            id="canvas-container"
            layout
            animate={{ 
              width: device === 'desktop' ? '100%' : '375px',
              maxWidth: device === 'desktop' ? '1440px' : '375px'
            }}
            className={`bg-white shadow-2xl transition-all duration-700 overflow-hidden min-h-screen relative border-brand-charcoal ${
              device === 'mobile' ? 'rounded-[3rem] border-[12px] h-[812px] min-h-0 ring-4 ring-brand-stone/50' : 'rounded-none border-x-0'
            }`}
          >
            <div className={`h-full overflow-y-auto hide-scrollbar ${device === 'mobile' ? 'p-0' : ''}`}>
              {sections.map((section) => (
                <div 
                  key={section.id} 
                  onClick={() => setActiveId(section.id)}
                  className={`relative group/section transition-all cursor-default ${
                    activeId === section.id ? 'ring-2 ring-brand-charcoal ring-inset ring-offset-s2' : ''
                  }`}
                >
                  {/* Section Controls */}
                  <AnimatePresence>
                    {activeId === section.id && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute -left-12 top-0 flex flex-col gap-1 z-20 hidden lg:flex"
                      >
                        <button onClick={(e) => moveSection(section.id, 'up', e)} className="p-2 bg-brand-charcoal text-white rounded-lg shadow-lg hover:bg-black transition-colors"><MoveUp size={14}/></button>
                        <button onClick={(e) => moveSection(section.id, 'down', e)} className="p-2 bg-brand-charcoal text-white rounded-lg shadow-lg hover:bg-black transition-colors"><MoveDown size={14}/></button>
                        <button onClick={(e) => deleteSection(section.id, e)} className="p-2 bg-red-900/90 text-white rounded-lg shadow-lg hover:bg-red-800 transition-colors mt-2"><Trash2 size={14}/></button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <SectionView section={section} isMobile={device === 'mobile'} />
                  
                  {/* Hover visual cue */}
                  <div className="absolute inset-0 border border-transparent group-hover/section:border-brand-moss/20 pointer-events-none transition-colors" />
                </div>
              ))}

              <div className="py-32 flex flex-col items-center justify-center border-t border-brand-stone bg-brand-sand/20">
                <button 
                  onClick={() => setIsLibraryOpen(true)}
                  className="group flex flex-col items-center gap-4 transition-all duration-500 hover:scale-105"
                >
                  <div className="w-14 h-14 rounded-full bg-white border border-brand-stone flex items-center justify-center text-brand-moss group-hover:border-brand-moss group-hover:shadow-[0_0_20px_rgba(0,0,0,0.05)] transition-all">
                    <Plus size={28} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-brand-moss/40 group-hover:text-brand-moss transition-colors">Append Collection Section</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Settings Sidebar */}
        <aside className="w-80 border-l border-brand-stone bg-white h-[calc(100vh-3.5rem)] overflow-y-auto hide-scrollbar p-6 hidden xl:block">
          {activeId ? (
            <AnimatePresence mode="wait">
              <motion.div 
               key={activeId}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-brand-moss/40 mb-1 font-bold">Element Properties</h4>
                    <p className="font-serif text-2xl capitalize">
                      {sections.find(s => s.id === activeId)?.type.replace('-', ' ')}
                    </p>
                  </div>
                  <button className="text-brand-moss/40 hover:text-brand-charcoal transition-colors">
                    <Settings size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-bold flex items-center gap-2 border-b border-brand-stone pb-2">
                    <Type size={16} strokeWidth={1.5} /> Typography
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-brand-moss/50 font-semibold px-1">Display Title</label>
                      <textarea 
                        rows={3}
                        value={sections.find(s => s.id === activeId)?.content.title || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSections(sections.map(s => s.id === activeId ? { ...s, content: { ...s.content, title: val } } : s));
                        }}
                        className="w-full bg-brand-sand/50 p-4 rounded-2xl border border-brand-stone focus:border-brand-moss focus:ring-1 focus:ring-brand-moss/10 transition-all outline-none text-sm font-serif min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-bold flex items-center gap-2 border-b border-brand-stone pb-2">
                    <ImageIcon size={16} strokeWidth={1.5} /> Visual Medium
                  </h4>
                  <div className="space-y-4">
                    <div className="aspect-[4/5] bg-brand-sand rounded-3xl overflow-hidden group relative border border-brand-stone shadow-sm">
                      <img 
                        src={sections.find(s => s.id === activeId)?.content.image || "https://images.unsplash.com/photo-1549174138-f3b48423e0c6?q=80&w=2000"} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        alt="Current Asset"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <button className="w-full bg-white/90 backdrop-blur pb-2.5 pt-3 rounded-2xl text-[10px] uppercase tracking-widest font-bold shadow-2xl hover:bg-white transition-all">
                          Change Source
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-brand-moss/40 text-center italic">Optimized for high-resolution retina displays.</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-xs font-bold flex items-center gap-2 border-b border-brand-stone pb-2">Layout</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-brand-sand p-3 rounded-2xl border border-brand-stone">
                        <span className="text-[8px] uppercase tracking-tighter text-brand-moss/40 block mb-1">Padding Top</span>
                        <div className="flex items-center gap-2">
                          <input type="number" defaultValue={80} className="bg-transparent text-xs font-mono outline-none w-10" />
                          <span className="text-[10px] text-brand-moss/30 uppercase font-mono tracking-tighter">px</span>
                        </div>
                      </div>
                      <div className="bg-brand-sand p-3 rounded-2xl border border-brand-stone">
                        <span className="text-[8px] uppercase tracking-tighter text-brand-moss/40 block mb-1">Padding Bottom</span>
                        <div className="flex items-center gap-2">
                          <input type="number" defaultValue={80} className="bg-transparent text-xs font-mono outline-none w-10" />
                          <span className="text-[10px] text-brand-moss/30 uppercase font-mono tracking-tighter">px</span>
                        </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-brand-sand rounded-full border border-brand-stone flex items-center justify-center animate-pulse">
                  <Layers size={32} className="text-brand-stone" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-moss rounded-full flex items-center justify-center text-white shadow-xl">
                  <Settings size={14} className="animate-spin-slow" />
                </div>
              </div>
              <div>
                <p className="font-serif italic text-lg mb-2">Refining the Frame</p>
                <p className="text-xs text-brand-moss/50 max-w-[200px] leading-relaxed mx-auto">Select a component on the canvas to begin tailoring its architectural properties.</p>
              </div>
            </div>
          )}
        </aside>
      </main>

      <AnimatePresence>
        {isLibraryOpen && (
          <SectionLibrary 
            onAdd={onAddSection} 
            onClose={() => setIsLibraryOpen(false)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}