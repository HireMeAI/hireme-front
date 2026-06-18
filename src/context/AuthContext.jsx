import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      name: userData.name || userData.firstName || '',
      title: userData.title || userData.desiredJobTitle || '',
      role: userData.role || 'CANDIDATE'
    };
  };

  const [token, setToken] = useState(localStorage.getItem('hireme_token'));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hireme_user');
      return stored ? normalizeUser(JSON.parse(stored)) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clears the local session without touching the server (used on hard failures).
  const clearSession = () => {
    localStorage.removeItem('hireme_token');
    localStorage.removeItem('hireme_refresh_token');
    localStorage.removeItem('hireme_user');
    setToken(null);
    setUser(null);
  };

  // Exchanges the stored refresh token for a fresh access/refresh pair.
  const refreshSession = async () => {
    const refreshToken = localStorage.getItem('hireme_refresh_token');
    if (!refreshToken) return false;
    try {
      const data = await api.session.refresh(refreshToken);
      const tokenVal = data?.accessToken || data?.token;
      if (!tokenVal) return false;
      localStorage.setItem('hireme_token', tokenVal);
      setToken(tokenVal);
      if (data.refreshToken) localStorage.setItem('hireme_refresh_token', data.refreshToken);
      if (data.user) {
        const normalized = normalizeUser(data.user);
        setUser(normalized);
        localStorage.setItem('hireme_user', JSON.stringify(normalized));
      }
      return true;
    } catch (err) {
      console.error('Token refresh failed', err);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('hireme_token');
      if (savedToken) {
        try {
          const profile = await api.user.getMe();
          if (profile) {
            const normalized = normalizeUser(profile);
            setUser(normalized);
            localStorage.setItem('hireme_user', JSON.stringify(normalized));
          }
        } catch (err) {
          // Access token likely expired — try a silent refresh before giving up.
          const refreshed = await refreshSession();
          if (refreshed) {
            try {
              const profile = await api.user.getMe();
              if (profile) {
                const normalized = normalizeUser(profile);
                setUser(normalized);
                localStorage.setItem('hireme_user', JSON.stringify(normalized));
              }
            } catch (e) {
              clearSession();
            }
          } else {
            clearSession();
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    // Proactive refresh well within the 1h access-token lifetime.
    const refreshInterval = setInterval(() => { refreshSession(); }, 30 * 60 * 1000);

    const handleUnauthorized = () => clearSession();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.auth.login(email, password);
      const tokenVal = data.token || data.accessToken;
      if (!tokenVal) throw new Error("No token returned from server");

      localStorage.setItem('hireme_token', tokenVal);
      if (data.refreshToken) localStorage.setItem('hireme_refresh_token', data.refreshToken);
      setToken(tokenVal);

      // Use user from login response (now includes role), then enrich with full profile
      const baseUser = normalizeUser(data.user || { email });
      setUser(baseUser);
      localStorage.setItem('hireme_user', JSON.stringify(baseUser));

      try {
        const fullProfile = await api.user.getMe();
        const normalized = normalizeUser(fullProfile);
        setUser(normalized);
        localStorage.setItem('hireme_user', JSON.stringify(normalized));
      } catch (profileErr) {
        // Keep base user if profile fetch fails
      }

      return true;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (email, password, name, lastName, bio, title) => {
    setError(null);
    try {
      const response = await api.auth.register({ email, password, name, lastName, bio, title });
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    // Best-effort server-side revocation of the current access token.
    try { await api.session.logout(); } catch (e) { /* ignore network/expiry errors */ }
    clearSession();
  };

  // Revokes every active session for this user, then clears locally.
  const logoutAll = async () => {
    try { await api.session.logoutAll(); } catch (e) { /* ignore */ }
    clearSession();
  };

  // RGPD: permanently deletes the account, then clears locally.
  const deleteAccount = async () => {
    await api.users.deleteMe();
    clearSession();
  };

  const syncProfile = async () => {
    try {
      const updatedProfile = await api.user.getMe();
      if (updatedProfile) {
        const normalized = normalizeUser(updatedProfile);
        setUser(normalized);
        localStorage.setItem('hireme_user', JSON.stringify(normalized));
        return normalized;
      }
      return null;
    } catch (err) {
      console.error("Failed to sync profile", err);
    }
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    loading,
    error,
    login,
    register,
    logout,
    logoutAll,
    deleteAccount,
    refreshSession,
    syncProfile,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
