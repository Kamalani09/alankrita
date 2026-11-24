import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const Context = createContext(null);

export function AdminSession({ children }) {
  const [session, setSession] = useState(null);
  const signOut = useCallback(() => setSession(null), []);

  const signIn = useCallback(async (email, password) => {
    const { data } = await api.post('/admin/login', { email, password });
    setSession({ ...data.data, expiresAt: Date.now() + data.data.expiresIn * 1000 });
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(signOut, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session, signOut]);

  const request = useCallback(async (method, url, options = {}) => {
    try {
      const { data } = await api.request({
        method, url, ...options, headers: { Authorization: `Bearer ${session?.token}` },
      });
      return data.data;
    } catch (error) {
      if (error.response?.status === 401) {
        setSession((current) => current === session ? null : current);
      }
      throw error;
    }
  }, [session]);

  const value = useMemo(() => ({ session, signIn, signOut, request }), [session, signIn, signOut, request]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAdmin() {
  return useContext(Context);
}
