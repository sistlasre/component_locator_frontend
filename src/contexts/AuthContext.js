import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem('component-locator-token');
        const storedUser = localStorage.getItem('component-locator-user');
        
        if (storedToken && storedUser) {
          setUser(storedUser);
          setToken(storedToken);
          apiService.setAuthToken(storedToken);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('component-locator-token');
        localStorage.removeItem('component-locator-user');
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiService.login(username, password);
      const { user, token } = response.data;
      
      // Store both user and token
      localStorage.setItem('component-locator-token', token);
      localStorage.setItem('component-locator-user', user);
      
      // Update state
      setUser(user);
      setToken(token);
      apiService.setAuthToken(token);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const register = async (email, password, firstName='', lastName='') => {
    try {
      const response = await apiService.register(email, password, firstName, lastName);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('component-locator-token');
    localStorage.removeItem('component-locator-user');
    setUser(null);
    setToken(null);
    apiService.setAuthToken(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
