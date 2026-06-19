import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api, authApi, setAccessToken } from '../services/api';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthSuccess = useCallback((userData: User, token: string) => {
    setUser(userData);
    setToken(token);
    setAccessToken(token);
  }, []);

  useEffect(() => {
    authApi
      .refreshToken()
      .then(({ data }) => {
        setToken(data.accessToken);
        setAccessToken(data.accessToken);
        return api.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
      })
      .then(({ data: userData }) => {
        setUser(userData);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login({ email, password });
      handleAuthSuccess(data.user, data.accessToken);
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await authApi.register({ name, email, password });
      handleAuthSuccess(data.user, data.accessToken);
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    setToken(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
