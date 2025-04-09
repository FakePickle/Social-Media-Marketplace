import React, { createContext, useState, useEffect } from 'react';
import api, { updateTokens, clearTokens } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('userData')) || null);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                const { data } = await api.get('user/profile/');
                setIsAuthenticated(true);
                saveUserData(data); // Refresh user data
            } catch (error) {
                clearTokens();
                localStorage.removeItem('userData');
                setUserData(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        validateToken();
    }, []);

    // Save user data to localStorage
    const saveUserData = (data) => {
        localStorage.setItem('userData', JSON.stringify(data));
        setUserData(data);
    };

    const login = async (email, password) => {
        try {
            const { data } = await api.post('login/', { email, password });
            localStorage.setItem('pendingAuthEmail', email); // Store for 2FA
            return data; // { message: "Please enter your 2FA code", email }
        } catch (error) {
            setIsAuthenticated(false);
            throw error.response?.data || { error: 'Login failed' };
        }
    };

    const logout = () => {
        const refresh = localStorage.getItem('refreshToken');
        if (refresh) {
            api.post('token/blacklist/', { refresh }).catch(() => {});
        }
        clearTokens();
        localStorage.removeItem('userData');
        localStorage.removeItem('pendingAuthEmail');
        setUserData(null);
        setIsAuthenticated(false);
    };

    const register = async (email, username, password, first_name, last_name, dob) => {
        try {
            const { data } = await api.post('register/', {
                email,
                username,
                password,
                first_name,
                last_name,
                dob,
            });
            return data; // { message, email, code }
        } catch (error) {
            throw error.response?.data || { error: 'Register failed' };
        }
    };

    const verifyEmail = async (otp, email) => {
        try {
            const { data } = await api.post('verify-email/', { otp, email });
            return data; // { message, qr_code, secret_key, totp_uri }
        } catch (error) {
            throw error.response?.data || { error: error.message || 'Email verification failed' };
        }
    };

    const verify2FA = async (totp_code, email) => {
        try {
            const { data } = await api.post('verify-2fa/', { totp_code, email });
            if (data.access && data.refresh) {
                updateTokens(data.access, data.refresh);
                setIsAuthenticated(true);
                localStorage.removeItem('pendingAuthEmail');
                saveUserData(data.user);
            }
            return data; // { message, access, refresh, user }
        } catch (error) {
            setIsAuthenticated(false);
            throw error.response?.data || { error: error.message || '2FA verification failed' };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                login,
                logout,
                register,
                verifyEmail,
                verify2FA,
                isAuthenticated,
                setIsAuthenticated,
                isLoading,
                userData,
                setUserData: saveUserData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
