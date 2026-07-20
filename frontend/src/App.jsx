import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import { useSocket } from './hooks/useSocket';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkersPage from './pages/WorkersPage';
import WorkerDetailPage from './pages/WorkerDetailPage';
import ReportsPage from './pages/ReportsPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

// Components
import BottomNav from './components/BottomNav';

function ProtectedLayout({ children }) {
  const { isAuth } = useStore();
  useSocket(); // Initialize socket connection

  if (!isAuth) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const { isAuth } = useStore();

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#141c14',
            color: '#f0fdf0',
            border: '1px solid #1f2f1f',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0a0f0a' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0f0a' } },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={<ProtectedLayout><DashboardPage /></ProtectedLayout>}
        />
        <Route
          path="/workers"
          element={<ProtectedLayout><WorkersPage /></ProtectedLayout>}
        />
        <Route
          path="/workers/:id"
          element={<ProtectedLayout><WorkerDetailPage /></ProtectedLayout>}
        />
        <Route
          path="/reports"
          element={<ProtectedLayout><ReportsPage /></ProtectedLayout>}
        />
        <Route
          path="/payments"
          element={<ProtectedLayout><PaymentsPage /></ProtectedLayout>}
        />
        <Route
          path="/settings"
          element={<ProtectedLayout><SettingsPage /></ProtectedLayout>}
        />
        <Route
          path="/admin"
          element={<ProtectedLayout><AdminPage /></ProtectedLayout>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
