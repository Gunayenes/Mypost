import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import OnboardingTour from '@/components/OnboardingTour';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User, HelpCircle } from 'lucide-react';
import { isElectron } from '@/utils/platform';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(isElectron() ? '/login' : '/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <OnboardingTour />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('start-tour'))}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
              title="Kullanım Rehberi"
            >
              <HelpCircle size={16} />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <span className="font-medium">{user?.fullName}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-danger transition-colors"
            >
              <LogOut size={16} />
              Çıkış
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
