import axios from "axios";

const api = axios.create({
  baseURL: "https://192.168.2.238/api/",
  withCredentials: true,
});

// Load tokens initially from localStorage
let accessToken = localStorage.getItem("accessToken");
let refreshToken = localStorage.getItem("refreshToken");

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

export const updateTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export default api;
