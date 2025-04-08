import React, { createContext, useState, useEffect } from 'react';
import api, { updateTokens, clearTokens } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify token with backend
        await api.get('verify-token/');
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid or expired
        clearTokens();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("login/", { email, password });
      updateTokens(data.access, data.refresh);
      setIsAuthenticated(true);
      return data; // Return the response data which includes the email
    } catch (error) {
      setIsAuthenticated(false);
      throw error.response?.data || { error: "Login failed" };
    }
  };

  const logout = () => {
    const refresh = localStorage.getItem("refreshToken");
    if (refresh) {
      api.post("token/blacklist/", { refresh }).catch(() => {});
    }
    clearTokens();
    setIsAuthenticated(false);
  };

  const register = async (email, username, password, first_name, last_name, dob) => {
    try {
      const { data } = await api.post("register/", { 
        email, 
        username, 
        password, 
        first_name, 
        last_name, 
        dob 
      });
      return data; // This returns message and verify-endpoint, not QR code
    } catch (error) {
      throw error.response?.data || { error: "Register failed" };
    }
  };

  const verifyEmail = async (otp, email) => {
    try {
      const response = await api.post("verify-email/", {
        otp,
        email
      });
      // This returns the QR code, secret key, and TOTP URI
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: error.message || "Verification failed." };
    }
  };

  const verify2FA = async (totp_code, email) => {
    try {
      const response = await api.post("verify-2fa/", {
        totp_code,
        email
      });

      if (response.data.access && response.data.refresh) {
        updateTokens(response.data.access, response.data.refresh);
        setIsAuthenticated(true);
      }

      return response.data;
    } catch (error) {
      setIsAuthenticated(false);
      throw error.response?.data || { error: error.message || "2FA verification failed." };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      login, 
      logout, 
      register, 
      verifyEmail, 
      verify2FA, 
      isAuthenticated, 
      setIsAuthenticated,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

