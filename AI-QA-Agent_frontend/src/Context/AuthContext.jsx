import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, setAuthToken } from '../Api/Api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('qa_agent_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('qa_agent_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync token to API client on startup or changes
  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem('qa_agent_token', token);
    } else {
      setAuthToken(null);
      localStorage.removeItem('qa_agent_token');
    }
  }, [token]);

  // Sync user object
  useEffect(() => {
    if (user) {
      localStorage.setItem('qa_agent_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qa_agent_user');
    }
  }, [user]);

  // Verify token on mount
  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const freshUser = await getCurrentUser();
          if (freshUser) {
            setUser(freshUser);
          }
        } catch (err) {
          // Token expired or invalid
          console.warn('Session expired, logging out:', err.message);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (emailOrUsername, password) => {
    const data = await loginUser({ email_or_username: emailOrUsername, password });
    if (data && data.access_token) {
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Authentication response did not contain an access token.');
  };

  const register = async (username, email, password) => {
    const data = await registerUser({ username, email, password });
    if (data && data.access_token) {
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Registration response did not contain an access token.');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('qa_agent_token');
    localStorage.removeItem('qa_agent_user');
    setAuthToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
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

export default AuthContext;
