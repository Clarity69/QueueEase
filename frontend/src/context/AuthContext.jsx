import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getMe().then(setUser).catch(err => { if (![401, 403].includes(err.response?.status)) setError("Tidak dapat terhubung ke server. Coba muat ulang halaman."); }).finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  const signOut = async () => { await logout(); setUser(null); };
  return <AuthContext.Provider value={{ user, setUser, loading, error, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
