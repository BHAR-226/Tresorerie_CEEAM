import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import type { UserRole } from '../types';

interface AuthUser {
  nom: string;
  prenom: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ceeam_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('ceeam_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('ceeam_token', token);
    } else {
      localStorage.removeItem('ceeam_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ceeam_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ceeam_user');
    }
  }, [user]);

  const login = async (username: string, password: string) => {
    const data = await authService.login(username, password);
    setToken(data.access_token);
    const authUser: AuthUser = {
      nom: data.user_nom,
      prenom: data.user_prenom,
      role: data.role,
    };
    setUser(authUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ceeam_token');
    localStorage.removeItem('ceeam_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
