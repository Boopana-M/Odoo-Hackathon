import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [employee, setEmployee] = useState(authService.getCurrentEmployee());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      if (authService.isAuthenticated()) {
        try {
          const data = await authService.getMe();
          setUser(data.user);
          setEmployee(data.employee);
        } catch (err) {
          console.error('Session verification failed', err);
          authService.logout();
          setUser(null);
          setEmployee(null);
        }
      }
      setLoading(false);
    }
    checkSession();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setEmployee(data.employee);
    return data;
  };

  const signup = async (name, email, password) => {
    return await authService.signup(name, email, password);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ user, employee, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
