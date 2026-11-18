import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '../types.ts';
import { api, getStoredToken, setStoredToken } from '../services/api.ts';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    position: string;
    height_cm: number;
    weight_kg: number;
    goal: string;
  }) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      setUser(null);
      setStoredToken(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const me = await api.getMe();
        setUser(me);
      } catch {
        setUser(null);
        setStoredToken(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedUser = await api.login(email, password);
    setUser(loggedUser);
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    position: string;
    height_cm: number;
    weight_kg: number;
    goal: string;
  }) => {
    const createdUser = await api.register(payload);
    setUser(createdUser);
  };

  const loginDemo = async () => {
    const demoUser = await api.demoLogin();
    setUser(demoUser);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateProfile = async (payload: Partial<User>) => {
    const updated = await api.updateProfile(payload);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginDemo,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
