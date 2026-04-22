/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Package, 
  LayoutDashboard, 
  Megaphone, 
  BarChart3, 
  Settings, 
  Globe, 
  Search, 
  Bell, 
  HelpCircle, 
  MoreVertical, 
  ChevronRight, 
  ArrowRight, 
  MessageSquare, 
  Mail, 
  Ban, 
  Star,
  CheckCircle2,
  Trash2,
  Edit,
  User,
  StickyNote,
  X,
  Filter,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, Customer, Order, Product, Review } from './types';

// Mock Data
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Layla Al-Mahmoud',
    email: 'layla.m@elegance.ae',
    avatar: 'https://picsum.photos/seed/layla/200/200',
    orders: 12,
    totalSpent: 14250.00,
    status: 'VIP',
    lastOrder: 'Oct 24, 2023',
    phone: '+971 50 123 4567',
    memberSince: 'Oct 2023',
    address: {
      street: 'Villa 142, Street 12C',
      area: 'Jumeirah 3',
      city: 'Dubai',
      country: 'United Arab Emirates'
    }
  },
  {
    id: '2',
    name: 'Fatima Noor',
    email: 'fatima.n@gmail.com',
    avatar: 'https://picsum.photos/seed/fatima/200/200',
    orders: 5,
    totalSpent: 3840.00,
    status: 'Returning',
    lastOrder: 'Nov 12, 2023'
  },
  {
    id: '3',
    name: 'Zahra Mansour',
    email: 'z.mansour@outlook.com',
    avatar: 'https://picsum.photos/seed/zahra/200/200',
    orders: 1,
    totalSpent: 550.00,
    status: 'New',
    lastOrder: 'Dec 01, 2023'
  },
  {
    id: '4',
    name: 'Aisha Ibrahim',
    email: 'a.ibrahim@royalty.com',
    avatar: 'https://picsum.photos/seed/aisha/200/200',
    orders: 24,
    totalSpent: 28110.00,
    status: 'VIP',
    lastOrder: 'Nov 29, 2023'
  }
];

const MOCK_ORDERS: Order[] = [
  { id: '#LN-92841', date: 'Oct 24, 2023', total: 1420.00, payment: 'Paid', fulfillment: 'Shipped' },
  { id: '#LN-91024', date: 'Sept 12, 2023', total: 890.00, payment: 'Paid', fulfillment: 'Delivered' },
  { id: '#LN-88932', date: 'Aug 05, 2023', total: 2100.00, payment: 'Paid', fulfillment: 'Delivered' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Silk Abaya - Emerald', price: 450.00, image: 'https://picsum.photos/seed/abaya1/300/400' },
  { id: 'p2', name: 'Chiffon Wrap - Sand', price: 85.00, image: 'https://picsum.photos/seed/wrap1/300/400' },
  { id: 'p3', name: 'Linen Palazzo Pant', price: 320.00, image: 'https://picsum.photos/seed/pant1/300/400' },
  { id: 'p4', name: 'Wool Coat - Camel', price: 580.00, image: 'https://picsum.photos/seed/coat1/300/400' },
];

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    customerName: 'Laila R.',
    customerEmail: 'laila.r@example.com',
    customerAvatar: 'https://picsum.photos/seed/laila/200/200',
    productName: 'Silk Evening Abaya',
    productImage: 'https://picsum.photos/seed/abaya2/100/150',
    rating: 5,
    comment: 'The quality of the silk is beyond my expectations. It flows so beautifully and feels incredibly soft against the skin.',
    status: 'Pending',
    date: 'Oct 24, 2023'
  },
  {
    id: 'r2',
    customerName: 'Zahra K.',
    customerEmail: 'zahra.k@webmail.com',
    customerAvatar: 'https://picsum.photos/seed/zahra/200/200',
    productName: 'Linen Essential Dress',
    productImage: 'https://picsum.photos/seed/dress1/100/150',
    rating: 5,
    comment: "Perfect for daily wear. The cut is modest yet very flattering. I've bought three colors already!",
    status: 'Featured',
    date: 'Oct 21, 2023'
  },
  {
    id: 'r3',
    customerName: 'Mariam A.',
    customerEmail: 'mariam.a@provider.com',
    customerAvatar: 'https://picsum.photos/seed/mariam/200/200',
    productName: 'Premium Modal Hijab',
    productImage: 'https://picsum.photos/seed/hijab1/100/150',
    rating: 4,
    comment: "Very breathable and doesn't slip throughout the day. Only wish there were more pastel shades.",
    status: 'Approved',
    date: 'Oct 19, 2023'
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<View>('customers');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const selectedCustomer = MOCK_CUSTOMERS.find(c => c.id === selectedCustomerId) || MOCK_CUSTOMERS[0];

  const renderContent = () => {
    switch (currentPage) {
      case 'customers':
        return <CustomersListView onSelectCustomer={(id) => { setSelectedCustomerId(id); setCurrentPage('customer-detail'); }} onSwitchToReviews={() => setCurrentPage('reviews')} />;
      case 'customer-detail':
        return <CustomerDetailView customer={selectedCustomer} onBack={() => setCurrentPage('customers')} />;
      case 'reviews':
        return <ReviewsDashboardView onSwitchToCustomers={() => setCurrentPage('customers')} onSelectReview={setSelectedReview} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col pl-64">
        <Header />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selectedReview && (
          <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Sidebar({ currentPage, onNavigate }: { currentPage: View, onNavigate: (v: View) => void }) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'customers', icon: Users, label: 'Customers', isActive: currentPage === 'customers' || currentPage === 'customer-detail' || currentPage === 'reviews' },
    { id: 'marketing', icon: Megaphone, label: 'Marketing' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'website', icon: Globe, label: 'Website Builder' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-outline-variant/10 bg-surface flex flex-col py-8 px-4 z-50">
      <div className="mb-12 px-4">
        <h1 className="text-xl font-serif italic text-primary dark:text-[#D4C3A9]">Bisora Admin</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 mt-1">Luxury Muslimah Fashion</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as View)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-all duration-300 rounded ${
              item.isActive 
                ? 'bg-surface-low text-primary font-semibold border-r-2 border-primary' 
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-low/50'
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto px-4 pt-8 border-t border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            <img 
              alt="Admin" 
              className="w-full h-full object-cover" 
              src="https://picsum.photos/seed/admin/100/100" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary">Sofia Al-Farsi</p>
            <p className="text-[10px] text-on-surface-variant/70">Senior Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-outline-variant/5 flex justify-between items-center h-16 px-8">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant w-4 h-4" />
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-2 bg-transparent border-none text-sm focus:ring-0 outline-none" 
            placeholder="Search Bisora..." 
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative text-primary hover:opacity-70 transition-opacity">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-error rounded-full"></span>
        </button>
        <button className="text-primary hover:opacity-70 transition-opacity">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-outline-variant/20 mx-2"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <span className="text-xs tracking-wider text-primary font-medium">Admin Profile</span>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/10 group-hover:scale-105 transition-transform">
            <img 
              alt="Profile" 
              className="w-full h-full object-cover" 
              src="https://picsum.photos/seed/profile/100/100" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function CustomersListView({ onSelectCustomer, onSwitchToReviews }: { onSelectCustomer: (id: string) => void, onSwitchToReviews: () => void }) {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-4xl font-serif text-on-surface mb-2 tracking-tight">Customers</h2>
        <p className="text-on-surface-variant text-sm tracking-wide">Manage your customers and relationships</p>
      </div>

      <div className="flex gap-10 border-b border-outline-variant/10">
        <button className="pb-4 text-sm font-medium text-primary border-b-2 border-primary tracking-wide">All Customers</button>
        <button onClick={onSwitchToReviews} className="pb-4 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors tracking-wide">Reviews</button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/60 w-5 h-5" />
          <input 
            type="text" 
            className="w-full bg-surface-low border-none rounded-sm pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary/20 placeholder:text-outline-variant/60" 
            placeholder="Search customers..." 
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-surface-low text-primary text-sm font-semibold rounded-sm hover:bg-surface-container-high transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-sm hover:opacity-90 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Customer
          </button>
        </div>
      </div>

      <div className="bg-surface-lowest overflow-hidden shadow-sm border border-outline-variant/10 rounded-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-low/50">
            <tr>
              <th className="px-8 py-5 text-[11px] uppercase tracking-[0.15em] font-semibold text-on-surface-variant/70">Customer</th>
              <th className="px-8 py-5 text-[11px] uppercase tracking-[0.15em] font-semibold text-on-surface-variant/70">Orders</th>
              <th className="px-8 py-5 text-[11px] uppercase tracking-[0.15em] font-semibold text-on-surface-variant/70">Total Spent</th>
              <th className="px-8 py-5 text-[11px] uppercase tracking-[0.15em] font-semibold text-on-surface-variant/70">Status</th>
              <th className="px-8 py-5 text-[11px] uppercase tracking-[0.15em] font-semibold text-on-surface-variant/70">Last Order</th>
              <th className="px-8 py-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {MOCK_CUSTOMERS.map((customer) => (
              <tr 
                key={customer.id} 
                onClick={() => onSelectCustomer(customer.id)}
                className="hover:bg-surface-low transition-colors group cursor-pointer"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center overflow-hidden border border-outline-variant/10">
                      <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{customer.name}</p>
                      <p className="text-xs text-on-surface-variant">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-serif text-on-surface">{customer.orders.toString().padStart(2, '0')}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-serif text-on-surface">${customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </td>
                <td className="px-8 py-6">
                  <StatusBadge status={customer.status} />
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs text-on-surface-variant">{customer.lastOrder}</span>
                </td>
                <td className="px-8 py-6 text-right relative">
                  <button className="p-2 hover:bg-outline-variant/10 rounded-full transition-colors text-on-surface-variant">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-on-surface-variant tracking-wider uppercase font-semibold">
        <p>Showing {MOCK_CUSTOMERS.length} of 2,482 customers</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-low rounded-sm hover:bg-outline-variant/10 disabled:opacity-30" disabled>Previous</button>
          <button className="px-4 py-2 bg-surface-low rounded-sm hover:bg-outline-variant/10">Next</button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailView({ customer, onBack }: { customer: Customer, onBack: () => void }) {
  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
        <button onClick={onBack} className="hover:text-primary transition-colors">Customers</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary font-bold">{customer.name}</span>
      </nav>

      <div className="flex justify-between items-end">
        <h2 className="text-4xl font-serif font-bold text-on-surface tracking-tight">{customer.name}</h2>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2 text-xs font-bold tracking-widest uppercase text-primary hover:bg-primary/10 transition-colors">Preview</button>
          <button className="px-5 py-2 text-xs font-bold tracking-widest uppercase text-primary border border-primary/20 hover:border-primary transition-all">Duplicate</button>
          <button className="bg-primary text-white px-6 py-2.5 text-xs font-bold tracking-widest uppercase rounded-sm shadow-lg shadow-primary/10 hover:bg-primary-dim transition-colors">Save Changes</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Spent" value={`$${customer.totalSpent.toLocaleString()}`} />
            <StatCard label="Total Orders" value={customer.orders.toString()} />
            <StatCard label="AOV" value={`$${(customer.totalSpent / customer.orders).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            <StatCard label="Lifetime Value" value={`$${customer.totalSpent.toLocaleString()}`} />
          </div>

          <div className="bg-surface-lowest overflow-hidden border border-outline-variant/10 rounded-sm">
            <div className="px-8 py-6 border-b border-surface-low">
              <h3 className="text-xl font-serif">Order History</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-surface-low/30 text-on-surface-variant/70 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Order ID</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Total</th>
                  <th className="px-8 py-4">Payment</th>
                  <th className="px-8 py-4">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {MOCK_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-low/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-semibold text-primary">{order.id}</td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant">{order.date}</td>
                    <td className="px-8 py-5 text-sm font-serif text-on-surface">${order.total.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full ${
                        order.payment === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>{order.payment}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest bg-surface-low text-on-surface-variant rounded-full">{order.fulfillment}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-8 py-4 bg-surface-low flex justify-end">
              <button className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                View All History <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-surface-lowest p-8 border border-outline-variant/10 rounded-sm">
            <h3 className="text-xl font-serif mb-8">Recent Purchases</h3>
            <div className="grid grid-cols-4 gap-6">
              {MOCK_PRODUCTS.map((product) => (
                <div key={product.id} className="group cursor-pointer">
                  <div className="aspect-[3/4] overflow-hidden bg-surface-low mb-3">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                  <p className="text-xs font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">{product.name}</p>
                  <p className="text-[11px] font-serif text-primary mt-1">${product.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="col-span-4 flex flex-col gap-8">
          <div className="bg-surface-lowest p-8 border border-outline-variant/10 rounded-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full border border-outline-variant/20 p-1 mb-4">
                <img src={customer.avatar} alt={customer.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-on-surface">{customer.name}</h3>
              <p className="text-xs text-on-surface-variant font-medium mt-1">{customer.email}</p>
              <p className="text-xs text-on-surface-variant mt-1">{customer.phone}</p>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-4">Member Since {customer.memberSince}</p>
            </div>
            <div className="mt-8 pt-8 border-t border-surface-low flex flex-wrap gap-2">
              <span className="px-3 py-1 text-[10px] font-bold uppercase bg-primary text-white">VIP</span>
              <span className="px-3 py-1 text-[10px] font-bold uppercase bg-secondary/20 text-secondary">Returning</span>
              <span className="px-3 py-1 text-[10px] font-bold uppercase bg-surface-low text-on-surface-variant">High Spender</span>
            </div>
          </div>

          <div className="bg-surface-lowest p-8 border border-outline-variant/10 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-serif font-bold uppercase tracking-widest">Shipping Address</h3>
              <button className="text-[10px] font-bold text-primary uppercase border-b border-primary/20">Edit</button>
            </div>
            <div className="text-xs text-on-surface-variant leading-relaxed">
              <p className="font-bold text-on-surface mb-1">{customer.name}</p>
              <p>{customer.address?.street}</p>
              <p>{customer.address?.area}, {customer.address?.city}</p>
              <p>{customer.address?.country}</p>
              <p className="mt-2 flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Express Delivery preferred</p>
            </div>
          </div>

          <div className="bg-surface-lowest p-8 border border-outline-variant/10 rounded-sm">
            <h3 className="text-sm font-serif font-bold uppercase tracking-widest mb-6">Internal Notes</h3>
            <textarea 
              className="w-full bg-surface-low border-none text-xs p-4 min-h-[100px] focus:ring-1 focus:ring-primary/20 resize-none rounded-sm" 
              placeholder="Type internal note here..."
            />
            <button className="mt-4 w-full border border-primary/20 text-primary py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-surface-low transition-colors">Add Note</button>
            <div className="mt-6 flex flex-col gap-4">
              <div className="bg-surface p-3 border-l-2 border-primary/20">
                <p className="text-[10px] text-on-surface leading-normal italic">"Customer mentioned a preference for warm earth tones in the last call. Suggest the Autumn '24 preview."</p>
                <p className="text-[9px] text-on-surface-variant mt-2 font-semibold">BY SARAH M. — OCT 21</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-lowest p-8 border border-outline-variant/10 rounded-sm">
            <h3 className="text-sm font-serif font-bold uppercase tracking-widest mb-6">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <ActionButton icon={MessageSquare} label="Send WhatsApp" />
              <ActionButton icon={Mail} label="Send Email" />
              <ActionButton icon={Ban} label="Deactivate Account" variant="danger" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewsDashboardView({ onSwitchToCustomers, onSelectReview }: { onSwitchToCustomers: () => void, onSelectReview: (r: Review) => void }) {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif text-primary tracking-tight mb-2">Reviews</h2>
          <p className="text-on-surface-variant text-sm">Manage and moderate customer feedback across your collection.</p>
        </div>
        <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-sm hover:opacity-90 transition-colors">Export Report</button>
      </div>

      <div className="flex gap-8 border-b border-outline-variant/10">
        <button onClick={onSwitchToCustomers} className="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">All Customers</button>
        <button className="pb-4 text-sm font-bold text-primary border-b-2 border-primary">Reviews</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard icon={Star} label="Average Rating" value="4.8 ★" trend="+0.2 from last month" />
        <SummaryCard icon={MessageSquare} label="Total Reviews" value="2,482" />
        <SummaryCard icon={Bell} label="Pending Moderation" value="12" pulse />
      </div>

      <div className="bg-surface-low p-4 rounded-sm flex flex-wrap items-center gap-6">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Filter by:</span>
        <select className="bg-surface-lowest border-none text-sm py-2 pl-4 pr-10 rounded-sm focus:ring-1 focus:ring-primary/20 text-on-surface-variant">
          <option>Rating (All Stars)</option>
        </select>
        <select className="bg-surface-lowest border-none text-sm py-2 pl-4 pr-10 rounded-sm focus:ring-1 focus:ring-primary/20 text-on-surface-variant">
          <option>Status (All)</option>
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant w-4 h-4" />
          <input className="w-full bg-surface-lowest border-none text-sm py-2 pl-10 pr-4 rounded-sm focus:ring-1 focus:ring-primary/20" placeholder="Product (Search all collections)" />
        </div>
        <button className="text-sm font-bold text-primary hover:underline px-2">Clear All</button>
      </div>

      <div className="bg-surface-lowest rounded-sm overflow-hidden border border-outline-variant/10">
        <table className="w-full text-left">
          <thead className="bg-surface-low/30 border-b border-outline-variant/10">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Customer</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Product</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Rating</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Review</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {MOCK_REVIEWS.map((review) => (
              <tr key={review.id} className="hover:bg-surface transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <img src={review.customerAvatar} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-bold text-primary">{review.customerName}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tight">{review.customerEmail.split('@')[0]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <img src={review.productImage} className="w-10 h-14 object-cover rounded-sm bg-surface-low" referrerPolicy="no-referrer" />
                    <span className="text-sm text-on-surface-variant font-medium">{review.productName}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-outline-variant/30'}`} />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <p className="text-sm text-on-surface-variant line-clamp-2 max-w-xs">{review.comment}</p>
                </td>
                <td className="px-6 py-5">
                  <ReviewBadge status={review.status} />
                </td>
                <td className="px-6 py-5 text-xs text-on-surface-variant">{review.date}</td>
                <td className="px-6 py-5 text-right">
                  <button onClick={() => onSelectReview(review)} className="text-on-surface-variant hover:text-primary transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 flex items-center justify-between bg-surface-low/30 border-t border-outline-variant/10">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Showing {MOCK_REVIEWS.length} of 2,482 reviews</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded border border-outline-variant/20 text-xs font-bold text-primary bg-white disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1.5 rounded border border-outline-variant/20 text-xs font-bold text-primary bg-white">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ review, onClose }: { review: Review, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white max-w-lg w-full rounded-sm shadow-2xl overflow-hidden"
      >
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10">
              <img src={review.customerAvatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-primary">{review.customerName}</h4>
              <p className="text-xs text-on-surface-variant">{review.date} • Verified Purchase</p>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary p-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-8 py-4">
          <div className="flex items-start gap-4 p-4 bg-surface-low rounded mb-6 border border-outline-variant/10">
            <div className="w-20 h-28 flex-shrink-0 bg-white shadow-sm overflow-hidden rounded-sm">
              <img src={review.productImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Product</p>
              <p className="text-sm font-serif font-bold text-primary mb-3">{review.productName}</p>
              <div className="flex text-amber-500">
                 {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-outline-variant/30'}`} />
                  ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Full Review</p>
            <p className="text-md leading-relaxed text-on-surface shadow-primary-dim/10 serif italic">
              "{review.comment}"
            </p>
          </div>
        </div>
        <div className="px-8 pb-8 pt-4 flex flex-col gap-3">
          <div className="flex gap-3">
            <button className="flex-1 bg-primary text-white text-sm font-bold py-3 rounded-sm hover:opacity-90">Approve Review</button>
            <button className="flex-1 bg-surface-low text-primary text-sm font-bold py-3 border border-outline-variant/10 hover:bg-outline-variant/5">Mark as Featured</button>
          </div>
          <div className="flex gap-3 mt-1">
            <button className="flex-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-low py-2 transition-colors">Hide</button>
            <button className="flex-1 text-xs font-bold uppercase tracking-widest text-error hover:bg-error/5 py-2 transition-colors">Delete</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Helper Components
function StatusBadge({ status }: { status: Customer['status'] }) {
  const styles = {
    VIP: 'bg-primary text-white',
    Returning: 'bg-secondary/20 text-secondary',
    New: 'bg-surface-low text-on-surface-variant',
    'High Spender': 'bg-primary/10 text-primary',
  };
  return (
    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

function ReviewBadge({ status }: { status: Review['status'] }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Featured: 'bg-purple-50 text-purple-700 border-purple-200',
    Hidden: 'bg-surface-low text-on-surface-variant border-outline-variant/20',
  };
  return (
    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-surface-lowest p-6 flex flex-col gap-2 border border-outline-variant/5 shadow-sm">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{label}</p>
      <p className="text-2xl font-serif text-on-surface">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, variant = 'default' }: { icon: any, label: string, variant?: 'default' | 'danger' }) {
  return (
    <button className={`flex items-center justify-between px-4 py-3 transition-colors group rounded-sm ${
      variant === 'danger' ? 'text-error/80 hover:text-error' : 'bg-surface-low/50 hover:bg-surface-low text-on-surface'
    }`}>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      <Icon className={`w-4 h-4 ${variant === 'danger' ? 'text-error/40 group-hover:text-error' : 'text-on-surface-variant group-hover:text-primary'}`} />
    </button>
  );
}

function SummaryCard({ icon: Icon, label, value, trend, pulse }: { icon: any, label: string, value: string, trend?: string, pulse?: boolean }) {
  return (
    <div className="bg-surface-lowest p-6 rounded-sm border border-outline-variant/10 shadow-sm relative">
      <div className="flex justify-between items-start mb-4">
        <Icon className={`w-8 h-8 ${pulse ? 'text-error' : 'text-secondary'}`} />
        {trend && <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full">{trend}</span>}
        {pulse && <span className="flex h-2 w-2 rounded-full bg-error animate-pulse absolute top-6 right-6"></span>}
      </div>
      <h3 className="text-3xl font-bold font-serif text-primary mb-1">{value}</h3>
      <p className="text-sm text-on-surface-variant">{label}</p>
    </div>
  );
}
