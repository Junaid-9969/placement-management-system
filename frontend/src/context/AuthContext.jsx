import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    
    try {
      const res = await authAPI.getMe();
      setUser(res.data.data.user);
      setNotifications(res.data.data.user.notifications || []);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { initAuth(); }, [initAuth]);

  const login = async (credentials) => {
    
    const res = await authAPI.login(credentials);
    const { accessToken, refreshToken, user: userData } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    queryClient.clear();

    setUser(userData);
    setNotifications(userData.notifications || []);
    return userData;
  };

  const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    await authAPI.logout({ refreshToken });
  } catch {}

  localStorage.clear();

  queryClient.clear();

  setUser(null);
  setNotifications([]);
};

  const refreshNotifications = async () => {
    try {
      const res = await authAPI.getNotifications();
      setNotifications(res.data.data || []);
    } catch {}
  };

  const markNotificationsRead = async () => {
    try {
      await authAPI.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider value={{
      user, loading, notifications, unreadCount,
      login, logout, refreshNotifications, markNotificationsRead,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isStudent: user?.role === 'student',
      isCompany: user?.role === 'company',
      isTrainer: user?.role === 'trainer'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
