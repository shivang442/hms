import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = authService.getStoredUser();
      const token = authService.getToken();

      if (token && storedUser) {
        setUser(storedUser);
        try {
          // Verify and sync with backend
          const freshUser = await authService.getCurrentUser();
          setUser((prev) => ({ ...prev, ...freshUser }));
          localStorage.setItem('hms_user', JSON.stringify({ ...storedUser, ...freshUser }));
        } catch {
          // Token expired or invalid
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const authData = await authService.login(email, password);
    setUser(authData);
    return authData;
  };

  const register = async (formData) => {
    const authData = await authService.register(formData);
    setUser(authData);
    return authData;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    token: user?.token || authService.getToken(),
    role: user?.role,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
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
