import { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { _fireBackHandler } from './utils/backHandler';
import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DraftView from './pages/DraftView';
import SettingsPage from './pages/SettingsPage';

/* ── Inner app: has access to Router context ── */
function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useAppData();

  /* Android back button */
  useEffect(() => {
    const handleAndroidBack = () => {
      if (!_fireBackHandler()) navigate(-1);
    };
    window.addEventListener('androidBack', handleAndroidBack);
    return () => window.removeEventListener('androidBack', handleAndroidBack);
  }, [navigate]);

  /* Tell Android bridge whether we can go back */
  useEffect(() => {
    if (window.AndroidBridge) {
      window.AndroidBridge.setCanGoBack(location.pathname !== '/');
    }
  }, [location]);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Header />
      <main style={{ paddingBottom: 48 }}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/draft/:id" element={<DraftView />} />
          <Route path="/settings"  element={<SettingsPage />} />
          <Route path="*"          element={<Dashboard />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppDataProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppInner />
          </ConfirmProvider>
        </ToastProvider>
      </AppDataProvider>
    </HashRouter>
  );
}