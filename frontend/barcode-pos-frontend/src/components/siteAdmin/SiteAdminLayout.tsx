import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSiteAdminAuthStore } from '@/store/siteAdminAuthStore';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  Shield,
  KeyRound,
} from 'lucide-react';

const navItems = [
  { path: '/site-admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/site-admin/customers', icon: Users, label: 'Müşteriler', end: false },
  { path: '/site-admin/subscriptions', icon: CreditCard, label: 'Abonelikler', end: false },
  { path: '/site-admin/licenses', icon: KeyRound, label: 'Lisanslar', end: false },
];

export default function SiteAdminLayout() {
  const { email, logout } = useSiteAdminAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/site-admin/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-white/10">
          <Shield size={22} className="text-violet-400" />
          <span className="text-lg font-bold tracking-tight">Site Admin</span>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-gray-400 truncate mb-2 px-2">{email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-medium text-gray-500">KasaPlus Site Yönetimi</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield size={16} className="text-violet-500" />
            <span className="font-medium">Site Yöneticisi</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
