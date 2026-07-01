import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './views/Landing';
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import RecruiterDashboard from './views/RecruiterDashboard';
import ResumeBuilder from './views/ResumeBuilder';
import Profile from './views/Profile';
import Jobs from './views/Jobs';
import AppLayout from './components/AppLayout';
import CookieConsent from './components/CookieConsent';

function AppContent() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const isRecruiter = user?.role === 'RECRUITER';
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();

  // Token reset state and notifications from URL redirect
  const [resetToken, setResetToken] = useState(null);
  const [appNotification, setAppNotification] = useState(null);

  // Light / Dark theme state (default light: thème crème + terracotta du template)
  const [isLightTheme, setIsLightTheme] = useState(true);

  useEffect(() => {
    // Parse query params for redirect finalization
    const params = new URLSearchParams(window.location.search);
    const emailConfirmed = params.get('emailConfirmed');
    const emailError = params.get('error');
    const resetTokenParam = params.get('resetToken');
    const resetTokenError = params.get('resetTokenError');
    
    if (emailConfirmed === 'true') {
      setAppNotification({
        type: 'success',
        text: 'Votre adresse e-mail a été confirmée avec succès ! Vous pouvez maintenant vous connecter.'
      });
      navigate('/login');
    } else if (emailConfirmed === 'false') {
      setAppNotification({
        type: 'danger',
        text: `Erreur de confirmation d'e-mail : ${emailError || 'Jeton invalide ou expiré.'}`
      });
      navigate('/login');
    } else if (resetTokenParam) {
      setResetToken(resetTokenParam);
      navigate('/login');
    } else if (resetTokenError) {
      setAppNotification({
        type: 'danger',
        text: `Lien de réinitialisation invalide ou expiré : ${resetTokenError}`
      });
      navigate('/login');
    }
    
    // Clear query parameters in URL bar for clean UI
    if (emailConfirmed || resetTokenParam || resetTokenError) {
      const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [navigate]);

  useEffect(() => {
    // Synchronize theme with body class
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLightTheme]);

  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
  };

  const handleNavigateToBuilder = (resumeId) => {
    navigate(resumeId ? `/builder/${resumeId}` : '/builder');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="app-loading-screen">
        <span className="spinner large"></span>
        <p>Initialisation de HireMe AI...</p>
        <style>{`
          .app-loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: var(--bg-primary);
            color: var(--text-primary);
          }
        `}</style>
      </div>
    );
  }

  // Sidebar shell (cream + terracotta template) wrapping every authenticated page.
  const renderAuthenticatedLayout = (element) => (
    <AppLayout
      user={user}
      isRecruiter={isRecruiter}
      isAdmin={isAdmin}
      isLightTheme={isLightTheme}
      toggleTheme={toggleTheme}
      logout={logout}
    >
      {element}
    </AppLayout>
  );

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <>
                <div className="bg-mesh"></div>
                <Landing 
                  onNavigateToLogin={() => navigate('/login')} 
                  onNavigateToRegister={() => navigate('/register')} 
                />
              </>
            )
          } 
        />
        
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <>
                <div className="bg-mesh"></div>
                <Auth 
                  initialMode="login"
                  onBackToLanding={() => navigate('/')} 
                  resetToken={resetToken}
                  onResetTokenCleared={() => setResetToken(null)}
                  appNotification={appNotification}
                  onClearNotification={() => setAppNotification(null)}
                />
              </>
            )
          } 
        />

        <Route 
          path="/register" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <>
                <div className="bg-mesh"></div>
                <Auth 
                  initialMode="register"
                  onBackToLanding={() => navigate('/')} 
                  resetToken={resetToken}
                  onResetTokenCleared={() => setResetToken(null)}
                  appNotification={appNotification}
                  onClearNotification={() => setAppNotification(null)}
                />
              </>
            )
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              renderAuthenticatedLayout(
                isRecruiter || isAdmin
                  ? <RecruiterDashboard />
                  : <Dashboard onNavigateToBuilder={handleNavigateToBuilder} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              renderAuthenticatedLayout(<Profile />)
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/jobs"
          element={
            isAuthenticated
              ? isRecruiter || isAdmin
                ? <Navigate to="/dashboard" replace />
                : renderAuthenticatedLayout(<Jobs />)
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/builder"
          element={
            isAuthenticated
              ? isRecruiter || isAdmin
                ? <Navigate to="/dashboard" replace />
                : renderAuthenticatedLayout(<ResumeBuilder onBackToDashboard={handleBackToDashboard} />)
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/builder/:id"
          element={
            isAuthenticated
              ? isRecruiter || isAdmin
                ? <Navigate to="/dashboard" replace />
                : renderAuthenticatedLayout(<ResumeBuilder onBackToDashboard={handleBackToDashboard} />)
              : <Navigate to="/login" replace />
          }
        />

        {/* Fallback Route */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} 
        />
      </Routes>
      <CookieConsent />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
