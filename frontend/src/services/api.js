import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "http://localhost:5000/api"),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const getQueue = () => api.get("/queue").then((r) => r.data);
export const getAdminQueue = () => api.get("/queue/admin").then((r) => r.data);
export const getDisplayQueue = () => api.get("/queue/display", { timeout: 4500 }).then((r) => r.data);
export const getStats = () => api.get("/queue/stats").then((r) => r.data);
export const createQueue = (payload) => api.post("/queue", payload).then((r) => r.data);
export const callNext = () => api.patch("/queue/call-next").then((r) => r.data);
export const skipQueue = (id) => api.patch(`/queue/${id}/skip`).then((r) => r.data);
export const requeueTicket = (id) => api.patch(`/queue/${id}/requeue`).then((r) => r.data);
export const completeQueue = (id) => api.patch(`/queue/${id}/done`).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then(r => r.data);
export const login = (payload) => api.post("/auth/login", payload).then(r => r.data);
export const logout = () => api.post("/auth/logout").then(r => r.data);
api.interceptors.response.use(response => response, error => {
  const { url, method } = error.config || {};
  const adminRequest = url === "/queue/admin" || url === "/queue/stats" || (method === "patch" && url?.startsWith("/queue/"));
  if (adminRequest && [401, 403].includes(error.response?.status)) {
    window.dispatchEvent(new Event("session-expired"));
  }
  return Promise.reject(error);
});
