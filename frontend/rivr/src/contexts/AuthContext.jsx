import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
// import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [ isAuthenticated, setIsAuthenticated ] = useState(false);
  // const navigate = useNavigate();
  

  const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
  });

  // Set up Axios interceptors
  useEffect(() => {
    api.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const { data } = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
              refresh: refreshToken,
            });
            setAccessToken(data.access);
            localStorage.setItem('accessToken', data.access);
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
            return api(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
    }
);
}, [accessToken, refreshToken]);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const verifyTotp = async (otp, email) => {
  if (otp.length !== 6) {
    throw new Error("Please enter a 6-digit code");
  }
  try {
    const { data } = await api.post("verify-totp/", { otp, email });
    if (!data || typeof data.message !== "string") {
      throw new Error("Invalid response from server");
    }
    if (data.message === "Account verified successfully") {
      setIsAuthenticated(true);
      // navigate("/home");
      return true;
    } else {
      throw new Error("Verification failed");
    }
  } catch (error) {
    console.error("TOTP verification error:", error);
    setIsAuthenticated(false);
    throw new Error("Verification failed. Please try again.");
  }
};


const verifyData = async (username, password, email, firstName, lastName, dob) => {
  if (!username.trim() || !password.trim() || !email.trim() || !firstName.trim() || !lastName.trim() || !dob) {
    throw new Error("All fields are required");
  }
  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address");
  }
  try {
    const { data } = await api.post("verifyData/", {
      username,
      password,
      email,
      firstName,
      lastName,
      dob,
    });
    if (!data || typeof data.message !== "string") {
      throw new Error("Invalid response from server");
    }
    if (data.message === "Verification Email Sent") {
      return true;
    } else {
      throw new Error("Data verification failed");
    }
  } catch (error) {
    console.error("Data verification error:", error);
    throw new Error("Data verification failed. Please try again.");
  }
};

const verifyEmail = async (otp, email) => {
  if (otp.length !== 6) {
    throw new Error("Please enter a 6-digit code");
  }
  try {
    const { data } = await api.post("verifyEmail/", { otp, email });
    if (!data || typeof data.message !== "string") {
      throw new Error("Invalid response from server");
    }
    if (data.message === "Email verified successfully") {
      return true;
    } else {
      throw new Error("Verification failed");
    }
  } catch (error) {
    console.error("Email verification error:", error);
    throw new Error("Verification failed. Please try again.");
  }
};

const login = async (email, password) => {
try {
  const { data } = await api.post('login/', { email, password });
  setAccessToken(data.access);
  setRefreshToken(data.refresh);
  localStorage.setItem('accessToken', data.access);
  localStorage.setItem('refreshToken', data.refresh);
  setIsAuthenticated(true);
  console.log("Set is authenticated to true")
} catch (error) {
  setIsAuthenticated(false);
  console.log("LOGIN : Set is authenticated to false")
  throw error.response?.data || { error: 'Login failed' };
}
};

const register = async (email, username, password, first_name, last_name, dob) => {
  if (!username.trim() || !password.trim() || !email.trim() || !first_name.trim() || !last_name.trim() || !dob) {
    throw new Error("All fields are required");
  }
  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address");
  }
  try{
    const { data } = await api.post('register/', {email, username, password, first_name, last_name, dob});
    const message = data.message
    const instructions = data.instructions
    const qrCodeURL = data.qr_code
    const secret_key = data.secret_key
    return [message, instructions, qrCodeURL, secret_key]
  }catch (error){
    setIsAuthenticated(false);
  console.log("REGISTER : Set is authenticated to false")
  throw error.response?.data || { error: 'Register failed' };
  }
};



const logout = () => {
if (refreshToken) {
  api.post('token/blacklist/', { refresh: refreshToken }).catch(() => {});
}
setAccessToken(null);
setRefreshToken(null);
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
};

return (
    <AuthContext.Provider value={{ accessToken, login, register, logout, isAuthenticated, api, setIsAuthenticated, verifyData, verifyEmail, verifyTotp }}>
      {children}
    </AuthContext.Provider>
  );
};
