import axios from "axios";

const api = axios.create({
  baseURL:
    process.env
      .NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
  config => {
    try {
      const raw = localStorage.getItem("auth-storage");
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }

    return config;
  }
);

export default api;