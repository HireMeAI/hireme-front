import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './views/Landing';
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import RecruiterDashboard from './views/RecruiterDashboard';
import ResumeBuilder from './views/ResumeBuilder';
import Profile from './views/Profile';

function AppContent() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const isRecruiter = user?.role === 'RECRUITER';
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();
  const location = useLocation();
  
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

  // Define layout for authenticated views
  const renderAuthenticatedLayout = (element) => {
    return (
      <>
        <div className="bg-mesh"></div>
        
        {/* Premium Global Navigation Bar */}
        <nav className="navbar">
          <div className="nav-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#logo-grad-small)" />
              <path d="M2 17L12 22L22 17" stroke="url(#logo-grad-small)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="url(#logo-grad-small)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-grad-small" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>
            </svg>
            <span>HireMe AI</span>
          </div>

          <ul className="nav-links">
            <li>
              <NavLink 
                to="/dashboard"
                className={({ isActive }) => `nav-btn-link ${isActive || location.pathname.startsWith('/builder') ? 'active' : ''}`}
              >
                Tableau de bord
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/profile"
                className={({ isActive }) => `nav-btn-link ${isActive ? 'active' : ''}`}
              >
                Mon Profil
              </NavLink>
            </li>
          </ul>

          <div className="nav-actions">
            {/* Light / Dark Mode Toggle */}
            <button className="theme-toggle" onClick={toggleTheme} title="Changer de thème">
              {isLightTheme ? (
                /* Moon Icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                /* Sun Icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              )}
            </button>
            
            <button className="btn btn-secondary btn-sm" onClick={logout}>
              Se déconnecter
            </button>
          </div>
        </nav>

        {/* Main View Router */}
        <main className="main-content">
          {element}
        </main>

        <footer className="footer-layout">
          <p>© 2026 HireMe AI - Plateforme intelligente de recrutement de talents. Tous droits réservés.</p>
        </footer>

        <style>{`
          .nav-actions {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .footer-layout {
            text-align: center;
            padding: 30px 20px;
            border-top: 1px solid var(--card-border);
            margin-top: 40px;
            background: hsla(224, 25%, 8%, 0.4);
            backdrop-filter: var(--blur);
            font-size: 0.85rem;
            color: var(--text-muted);
          }
          body.light-theme .footer-layout {
            background: hsla(40, 30%, 99%, 0.5);
          }
        `}</style>
      </>
    );
  };

  return (
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
