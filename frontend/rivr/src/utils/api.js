import axios from "axios";

const api = axios.create({
  baseURL: "https://192.168.2.238/api/",
  withCredentials: true,
});

// Load tokens initially from localStorage
let accessToken = localStorage.getItem("accessToken");
let refreshToken = localStorage.getItem("refreshToken");
// Token management functions
export const updateTokens = (access, refresh) => {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
  scheduleTokenRefresh(access);
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  if (refreshTimeout) clearTimeout(refreshTimeout);
};

// Proactive token refresh
let refreshTimeout = null;
const getTokenExpiration = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch (e) {
    console.error("Invalid token:", e);
    return Date.now();
  }
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    console.error("No refresh token available");
    clearTokens();
    return false;
  }
  try {
    const { data } = await axios.post(
      "http://127.0.0.1:8000/api/token/refresh/",
      {
        refresh: refreshToken,
      },
    );
    console.log("Token refresh response:", data);
    updateTokens(data.access, data.refresh);
    return true;
  } catch (err) {
    console.error("Token refresh failed:", err.response?.data || err.message);
    clearTokens();
    return false;
  }
};

const scheduleTokenRefresh = (accessToken) => {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  const expiration = getTokenExpiration(accessToken);
  const now = Date.now();
  const timeUntilExpiry = expiration - now;
  const refreshThreshold = 60 * 1000; // 1 minute before expiry
  const refreshTime = Math.max(timeUntilExpiry - refreshThreshold, 0);

  if (refreshTime > 0) {
    refreshTimeout = setTimeout(async () => {
      await refreshAccessToken();
    }, refreshTime);
    console.log(`Scheduled token refresh in ${refreshTime / 1000} seconds`);
  } else {
    refreshAccessToken();
  }
};

// Request interceptor
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          "https://192.168.2.238/api/token/refresh/",
          {
            refresh: refreshToken,
          },
        );
        accessToken = data.access;
        // localStorage.setItem("accessToken", data.access);
        localStorage.setItem("accessToken", accessToken);
        // originalRequest.headers.Authorization = `Bearer ${data.access}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        // Let AuthContext handle logout on 401 if needed
        clearTokens();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);



export default api;
