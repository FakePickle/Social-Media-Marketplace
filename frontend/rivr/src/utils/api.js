import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

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
    localStorage.setItem("accessToken", data.access);
    scheduleTokenRefresh(data.access);
    console.log("Token refreshed successfully");
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
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    console.log("Request with token:", accessToken);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      console.warn("No access token found for request");
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newAccessToken = localStorage.getItem("accessToken");
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
      return Promise.reject({ ...error, requiresLogin: true });
    }
    return Promise.reject(error);
  },
);

// Initial setup
const initialAccessToken = localStorage.getItem("accessToken");
if (initialAccessToken) {
  scheduleTokenRefresh(initialAccessToken);
}

export default api;
