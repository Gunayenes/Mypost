import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanBarcode,
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  ArrowLeftRight,
  BarChart3,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ScanBarcode, label: 'POS Satış' },
  { to: '/products', icon: Package, label: 'Ürünler' },
  { to: '/categories', icon: FolderTree, label: 'Kategoriler' },
  { to: '/customers', icon: Users, label: 'Müşteriler' },
  { to: '/sales', icon: ShoppingCart, label: 'Satışlar' },
  { to: '/stock', icon: ArrowLeftRight, label: 'Stok Hareketleri' },
  { to: '/reports', icon: BarChart3, label: 'Raporlar' },
  { to: '/backup', icon: Database, label: 'Yedekleme' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-sidebar text-white flex flex-col transition-all duration-200 shrink-0`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">KasaPlus</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-white/10"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
