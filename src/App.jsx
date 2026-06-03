import { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SidebarNav from './components/layout/SidebarNav';
import BottomNav from './components/layout/BottomNav';
import AppHeader from './components/layout/AppHeader';
import Toast from './components/ui/Toast';
import HomeScreen from './screens/HomeScreen';
import IzazoviScreen from './screens/IzazoviScreen';
import ArenaScreen from './screens/ArenaScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import PostignucaScreen from './screens/PostignucaScreen';
import ProfileScreen from './screens/ProfileScreen';

// Admin imports
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminChallenges from './pages/admin/AdminChallenges';
import AdminAchievements from './pages/admin/AdminAchievements';
import AdminTeams from './pages/admin/AdminTeams';
import AdminQuotes from './pages/admin/AdminQuotes';
import AdminNotifications from './pages/admin/AdminNotifications';

const SCREEN_TITLES = ['Početna', 'Navike', 'Arena', 'Rang lista', 'Izazovi', 'Profil'];

function AppShell() {
  const { signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [navValue, setNavValue] = useState(0);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const handleNavigate = (idx) => {
    setNavValue(idx);
  };

  const handleAdmin = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
      </div>
    );
  }

  const screens = [
    <HomeScreen key="home" onNavigate={handleNavigate} />,
    <IzazoviScreen key="izazovi" />,
    <ArenaScreen key="arena" />,
    <LeaderboardScreen key="leaderboard" />,
    <PostignucaScreen key="postignuca" />,
    <ProfileScreen key="profile" onLogout={handleLogout} />,
  ];

  return (
    <>
      <div className="notebook-bg" />

      {/* Desktop Layout */}
      <div className="desktop-layout app-shell">
        <SidebarNav
          navValue={navValue}
          setNavValue={setNavValue}
          onLogout={handleLogout}
          onAdmin={handleAdmin}
        />
        <div className="main-content">
          <div className="main-topbar">
            <div className="topbar-title">{SCREEN_TITLES[navValue]}</div>
          </div>
          <div className="content-area">
            {screens[navValue]}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="mobile-layout">
        <AppHeader onProfile={() => setNavValue(5)} />
        <div className="mobile-content">
          {screens[navValue]}
        </div>
        <BottomNav navValue={navValue} setNavValue={setNavValue} />
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      
      {/* Admin Route Group */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="challenges" element={<AdminChallenges />} />
        <Route path="achievements" element={<AdminAchievements />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="quotes" element={<AdminQuotes />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
