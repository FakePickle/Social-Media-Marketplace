import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [ isAuthenticated, setIsAuthenticated ] = useState(false);
  

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

const register = async (email, username, password, first_name, last_name) => {
  try{
    const { data } = await api.post('register/', {email, username, password, first_name, last_name});
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
    <AuthContext.Provider value={{ accessToken, login, register, logout, isAuthenticated, api, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
