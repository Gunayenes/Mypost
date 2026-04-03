import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useSiteAdminAuthStore } from '@/store/siteAdminAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import ToastContainer from '@/components/ui/ToastContainer';
import LicenseGate from '@/components/LicenseGate';
import SubscriptionGate from '@/components/SubscriptionGate';
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
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/pages/services/ServiceDetailPage'));
const StoreSettingsPage = lazy(() => import('@/pages/StoreSettingsPage'));

// ── Tanıtım sayfaları ──
const PublicLayout = lazy(() => import('@/components/public/PublicLayout'));
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const FeaturesPage = lazy(() => import('@/pages/public/FeaturesPage'));
const PricingPage = lazy(() => import('@/pages/public/PricingPage'));
// DownloadPage kaldırıldı
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const ServiceTrackingPage = lazy(() => import('@/pages/public/ServiceTrackingPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const EmailConfirmPage = lazy(() => import('@/pages/EmailConfirmPage'));

// ── Site Admin sayfaları ──
const SiteAdminLayout = lazy(() => import('@/components/siteAdmin/SiteAdminLayout'));
const SiteAdminLoginPage = lazy(() => import('@/pages/siteAdmin/SiteAdminLoginPage'));
const SiteAdminDashboardPage = lazy(() => import('@/pages/siteAdmin/SiteAdminDashboardPage'));
const SiteAdminCustomersPage = lazy(() => import('@/pages/siteAdmin/SiteAdminCustomersPage'));
const SiteAdminSubscriptionsPage = lazy(() => import('@/pages/siteAdmin/SiteAdminSubscriptionsPage'));
const SiteAdminLicensesPage = lazy(() => import('@/pages/siteAdmin/SiteAdminLicensesPage'));
const SiteAdminCustomerDetailPage = lazy(() => import('@/pages/siteAdmin/SiteAdminCustomerDetailPage'));
const SiteAdminSettingsPage = lazy(() => import('@/pages/siteAdmin/SiteAdminSettingsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin' && user.role !== 'Yonetici')
    return <Navigate to={isElectron() ? '/' : '/app'} replace />;
  return <>{children}</>;
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
        <Route path="backup" element={<AdminRoute><BackupPage /></AdminRoute>} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:id" element={<ServiceDetailPage />} />
        <Route path="servis-takip" element={<ServiceTrackingPage embedded />} />
        <Route path="store-settings" element={<AdminRoute><StoreSettingsPage /></AdminRoute>} />
      </Route>
      <Route path="/servis-takip" element={<ServiceTrackingPage />} />
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
        <Route path="iletisim" element={<ContactPage />} />
      </Route>

      {/* Kayıt sayfası */}
      <Route path="/kayit" element={<RegisterPage />} />
      <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
      <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
      <Route path="/email-dogrula" element={<EmailConfirmPage />} />

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
        <Route path="backup" element={<AdminRoute><BackupPage /></AdminRoute>} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:id" element={<ServiceDetailPage />} />
        <Route path="servis-takip" element={<ServiceTrackingPage embedded />} />
        <Route path="store-settings" element={<AdminRoute><StoreSettingsPage /></AdminRoute>} />
      </Route>

      {/* Servis Takip (müşteri dış erişim) */}
      <Route path="/servis-takip" element={<ServiceTrackingPage />} />

      {/* Site Admin */}
      <Route path="/site-admin/login" element={<SiteAdminLoginPage />} />
      <Route path="/site-admin" element={<ProtectedSiteAdminRoute><SiteAdminLayout /></ProtectedSiteAdminRoute>}>
        <Route index element={<SiteAdminDashboardPage />} />
        <Route path="customers" element={<SiteAdminCustomersPage />} />
        <Route path="customers/:id" element={<SiteAdminCustomerDetailPage />} />
        <Route path="subscriptions" element={<SiteAdminSubscriptionsPage />} />
        <Route path="licenses" element={<SiteAdminLicensesPage />} />
        <Route path="settings" element={<SiteAdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  const appContent = (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <ToastContainer />
        <SubscriptionGate>
          {electron ? posRoutes : webRoutes}
        </SubscriptionGate>
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
