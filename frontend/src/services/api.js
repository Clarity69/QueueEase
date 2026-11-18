import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const getQueue = () => api.get("/queue").then((r) => r.data);
export const getStats = () => api.get("/queue/stats").then((r) => r.data);
export const createQueue = (payload) => api.post("/queue", payload).then((r) => r.data);
export const callNext = () => api.patch("/queue/call-next").then((r) => r.data);
export const completeQueue = (id) => api.patch(`/queue/${id}/done`).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then(r => r.data);
export const login = (payload) => api.post("/auth/login", payload).then(r => r.data);
export const register = (payload) => api.post("/auth/register", payload).then(r => r.data);
export const logout = () => api.post("/auth/logout").then(r => r.data);
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !["/auth/login", "/auth/me"].includes(error.config?.url)) window.dispatchEvent(new Event("session-expired"));
  return Promise.reject(error);
});
