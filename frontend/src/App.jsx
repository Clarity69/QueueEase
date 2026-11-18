import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { GraduationCap, LayoutDashboard, Ticket } from "lucide-react";
import StudentPage from "./pages/StudentPage";
import AdminPage from "./pages/AdminPage";

import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { useState } from "react";

function Layout() {
  const { user, loading, signOut } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const isAdmin = user?.role === "admin";
  const sessionStatus = <p role="status" className="p-8 text-center">Memuat sesi...</p>;
  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
      isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
    }`;

  return (
    <div className="min-h-screen">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white"><Ticket size={22} /></div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">QueueEase</h1>
              <p className="text-xs text-slate-500">Sistem Antrean Digital Kampus</p>
            </div>
          </div>
          <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-2">
            <NavLink to="/" end className={linkClass}><GraduationCap size={17} /> Ambil Antrean</NavLink>
            <NavLink to="/dashboard" className={linkClass}><Ticket size={17} /> Antrean Saya</NavLink>
            {!loading && <NavLink to={isAdmin ? "/admin" : "/login"} className={linkClass}>
              <LayoutDashboard size={17} /> {isAdmin ? "Petugas" : "Masuk Petugas"}
            </NavLink>}
            {isAdmin && <button onClick={async () => { try { await signOut(); setLogoutError(""); } catch { setLogoutError("Gagal keluar. Coba kembali."); } }} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600">Keluar</button>}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {logoutError && <p role="alert">{logoutError}</p>}
        <Routes>
          <Route path="/login" element={loading ? sessionStatus : <LoginPage />} />
          <Route path="/" element={<StudentPage />} />
          <Route path="/admin" element={loading ? sessionStatus : isAdmin ? <AdminPage /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        QueueEase · Praktikum Pemrograman Berbasis Framework
      </footer>
    </div>
  );
}

export default function App() {
  return <AuthProvider><Layout /></AuthProvider>;
}
