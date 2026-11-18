import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../services/api";
export default function LoginPage() {
  const { user, setUser, error: connectionError } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError("");
    try { setUser(await login(form)); }
    catch (err) {
      setError(err.response?.data?.message || (err.response
        ? "Server gagal memproses login."
        : "API tidak dapat dijangkau. Pastikan backend berjalan."));
    }
    finally { setBusy(false); }
  };
  return <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
    <p className="text-sm font-semibold text-blue-600">SELAMAT DATANG DI QUEUEEASE</p>
    <h2 className="mt-2 text-2xl font-bold">Masuk sebagai petugas</h2>
    <p className="mt-2 text-sm text-slate-500">Gunakan username dan kata sandi akun petugas untuk mengelola antrean.</p>
    {(error || connectionError) && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error || connectionError}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="username" className="mb-2 block text-sm font-semibold">Username</label>
        <input id="username" required maxLength={32} autoComplete="username" autoCapitalize="none" spellCheck={false}
          value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="auth-input" />
      </div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Kata sandi</label><input id="password" type="password" required maxLength={128} autoComplete="current-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="auth-input" /></div>
      <button disabled={busy} className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Memproses..." : "Masuk"}</button>
    </form>
  </section>;
}
