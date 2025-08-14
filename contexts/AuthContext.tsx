

import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types';
import { handleApiResponse } from '../utils/utils';
import { useData } from './DataContext';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePfp: (pfpUrl: string) => Promise<void>;
  loading: boolean;
  checkSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dataContext = useData();

  const checkSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const { user: sessionUser } = await handleApiResponse<{ user: User }>(response);
        setUser(sessionUser);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error("Session check failed:", error.message);
      if (error.details) {
        console.error("Details:", error.details);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const { user: loggedInUser } = await handleApiResponse<{ user: User }>(response);
      setUser(loggedInUser);
      await dataContext.fetchData(); // Refetch all data for the new user
    } catch (error: any) {
      // Re-throw to be caught by the login page
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch(e){
        console.error("Logout failed", e)
    } finally {
        setUser(null);
        dataContext.clearData(); // Clear data on logout
        setLoading(false);
    }
  };

  const updatePfp = async (pfpUrl: string) => {
    if (user) {
        // Optimistic update
        setUser(prevUser => prevUser ? { ...prevUser, pfp: pfpUrl } : null);
        try {
            await dataContext.updateUser({ ...user, pfp: pfpUrl });
        } catch (error) {
            // Revert on failure
            console.error("Failed to update PFP, reverting.", error)
            setUser(prevUser => prevUser ? { ...prevUser, pfp: user.pfp } : null);
            throw new Error("Não foi possível salvar a foto de perfil no servidor.");
        }
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, updatePfp, loading, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};