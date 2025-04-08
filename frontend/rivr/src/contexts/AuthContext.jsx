import React, { createContext, useState } from 'react';
import api, { updateTokens, clearTokens } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));

  const login = async (email, password) => {
    try {
      const { data } = await api.post("login/", { email, password });
      updateTokens(data.access, data.refresh);
      setIsAuthenticated(true);
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
    // validation omitted
    try {
      const { data } = await api.post("register/", { email, username, password, first_name, last_name, dob });
      return [data.message, data.instructions, data.qr_code, data.secret_key];
    } catch (error) {
      throw error.response?.data || { error: "Register failed" };
    }
  };

  const verifyEmail = async (otp, email) => {
    try {
      console.log("Sending verification request with:", { otp, email });

      const response = await api.post("verify-email/", {
        otp,
        email
      });

      console.log("Verification response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Verification error:", error.response?.data);
      throw new Error(error.response?.data?.error || "Verification failed.");
    }
  };

  const verify2FA = async (totp_code, email) => {
    try {
      console.log("Sending 2FA verification request with:", { totp_code, email });

      const response = await api.post("verify-2fa/", {
        totp_code,
        email
      });

      console.log("2FA verification response:", response.data);

      // Store tokens if authentication successful
      if (response.data.access && response.data.refresh) {
        updateTokens(response.data.access, response.data.refresh);
        setIsAuthenticated(true);
      }

      return response.data;
    } catch (error) {
      console.error("2FA verification error:", error.response?.data);
      setIsAuthenticated(false);
      throw new Error(error.response?.data?.error || "2FA verification failed.");
    }
  };

  return (
    <AuthContext.Provider value={{ login, logout, register, verifyEmail, verify2FA, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

