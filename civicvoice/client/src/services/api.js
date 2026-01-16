// src/services/api.js
// central axios instance for frontend. Uses VITE_API_BASE_URL from .env
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL,
  timeout: 15000,
});

const token = localStorage.getItem("civic_token");
if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("civic_token");
      localStorage.removeItem("civic_user");
    }
    return Promise.reject(err);
  }
);

export default api;
