import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      name: userData.name || userData.firstName || '',
      title: userData.title || userData.desiredJobTitle || ''
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

  // Initialize and synchronize authentication state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('hireme_token');
      if (savedToken) {
        try {
          // Verify token by retrieving candidate profile
          const profile = await api.candidate.getMe();
          if (profile) {
            const normalized = normalizeUser(profile);
            setUser(normalized);
            localStorage.setItem('hireme_user', JSON.stringify(normalized));
          }
        } catch (err) {
          console.error("Token verification failed", err);
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen to global unauthorized events from API client
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.auth.login(email, password);
      // Backend LoginResponseDto contains token and refreshToken (or accessToken, user etc.)
      // Let's inspect the returned model structure or assume standard { token, user }
      const tokenVal = data.token || data.accessToken;
      if (!tokenVal) {
        throw new Error("No token returned from server");
      }
      
      localStorage.setItem('hireme_token', tokenVal);
      setToken(tokenVal);
      
      // Try to load full user details using the newly acquired token
      try {
        const fullProfile = await api.candidate.getMe();
        const normalized = normalizeUser(fullProfile);
        setUser(normalized);
        localStorage.setItem('hireme_user', JSON.stringify(normalized));
      } catch (profileErr) {
        // Fallback to minimal user details if getMe fails or isn't candidate
        const fallbackUser = data.user || { email, role: 'CANDIDATE' };
        const normalized = normalizeUser(fallbackUser);
        setUser(normalized);
        localStorage.setItem('hireme_user', JSON.stringify(normalized));
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
      // Depending on workflow, register might require email verification first.
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('hireme_token');
    localStorage.removeItem('hireme_user');
    setToken(null);
    setUser(null);
  };

  const syncProfile = async () => {
    try {
      const updatedProfile = await api.candidate.getMe();
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
    syncProfile,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
