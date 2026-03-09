import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useSiteAdminAuthStore } from '@/store/siteAdminAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import ToastContainer from '@/components/ui/ToastContainer';
import LicenseGate from '@/components/LicenseGate';
import { isElectron } from '@/utils/platform';

// ── POS App sayfaları ──
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const POSPage = lazy(() => import('@/pages/POSPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductFormPage = lazy(() => import('@/pages/ProductFormPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const SalesPage = lazy(() => import('@/pages/SalesPage'));
const StockPage = lazy(() => import('@/pages/StockPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const BackupPage = lazy(() => import('@/pages/BackupPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));

// ── Tanıtım sayfaları ──
const PublicLayout = lazy(() => import('@/components/public/PublicLayout'));
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const FeaturesPage = lazy(() => import('@/pages/public/FeaturesPage'));
const PricingPage = lazy(() => import('@/pages/public/PricingPage'));
const DownloadPage = lazy(() => import('@/pages/public/DownloadPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));

// ── Site Admin sayfaları ──
const SiteAdminLayout = lazy(() => import('@/components/siteAdmin/SiteAdminLayout'));
const SiteAdminLoginPage = lazy(() => import('@/pages/siteAdmin/SiteAdminLoginPage'));
const SiteAdminDashboardPage = lazy(() => import('@/pages/siteAdmin/SiteAdminDashboardPage'));
const SiteAdminCustomersPage = lazy(() => import('@/pages/siteAdmin/SiteAdminCustomersPage'));
const SiteAdminSubscriptionsPage = lazy(() => import('@/pages/siteAdmin/SiteAdminSubscriptionsPage'));
const SiteAdminLicensesPage = lazy(() => import('@/pages/siteAdmin/SiteAdminLicensesPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function ProtectedSiteAdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSiteAdminAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/site-admin/login" replace />;
}

const Spinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

export default function App() {
  const electron = isElectron();

  // Electron: sadece POS
  const posRoutes = (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="backup" element={<BackupPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Web: tanıtım + POS
  const webRoutes = (
    <Routes>
      {/* Tanıtım sayfaları */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="ozellikler" element={<FeaturesPage />} />
        <Route path="fiyatlandirma" element={<PricingPage />} />
        <Route path="indir" element={<DownloadPage />} />
        <Route path="iletisim" element={<ContactPage />} />
      </Route>

      {/* Kayıt sayfası */}
      <Route path="/kayit" element={<RegisterPage />} />

      {/* POS login + uygulama */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="backup" element={<BackupPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>

      {/* Site Admin */}
      <Route path="/site-admin/login" element={<SiteAdminLoginPage />} />
      <Route path="/site-admin" element={<ProtectedSiteAdminRoute><SiteAdminLayout /></ProtectedSiteAdminRoute>}>
        <Route index element={<SiteAdminDashboardPage />} />
        <Route path="customers" element={<SiteAdminCustomersPage />} />
        <Route path="subscriptions" element={<SiteAdminSubscriptionsPage />} />
        <Route path="licenses" element={<SiteAdminLicensesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  const appContent = (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <ToastContainer />
        {electron ? posRoutes : webRoutes}
      </Suspense>
    </BrowserRouter>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {electron ? (
        <LicenseGate>{appContent}</LicenseGate>
      ) : (
        appContent
      )}
    </QueryClientProvider>
  );
}
