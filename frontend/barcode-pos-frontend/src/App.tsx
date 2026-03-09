import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import ToastContainer from '@/components/ui/ToastContainer';
import LicenseGate from '@/components/LicenseGate';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

const Spinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LicenseGate>
        <BrowserRouter>
          <Suspense fallback={<Spinner />}>
            <ToastContainer />
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
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
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </LicenseGate>
    </QueryClientProvider>
  );
}
