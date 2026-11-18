import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../services/api";
export default function LoginPage() {
  const { user, setUser, error: connectionError } = useAuth();
  const [signup, setSignup] = useState(false);
  const [form, setForm] = useState({ nama: "", nim: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError("");
    try { setUser(await (signup ? register(form) : login(form))); }
    catch (err) { setError(err.response?.data?.message || "Tidak dapat terhubung ke server."); }
    finally { setBusy(false); }
  };
  return <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
    <p className="text-sm font-semibold text-blue-600">SELAMAT DATANG DI QUEUEEASE</p>
    <h2 className="mt-2 text-2xl font-bold">{signup ? "Daftar akun mahasiswa" : "Masuk ke akun Anda"}</h2>
    <p className="mt-2 text-sm text-slate-500">Gunakan NIM dan kata sandi untuk mengakses antrean.</p>
    {(error || connectionError) && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error || connectionError}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4">
      {signup && <div><label htmlFor="nama" className="mb-2 block text-sm font-semibold">Nama lengkap</label><input id="nama" required maxLength={100} autoComplete="name" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="auth-input" /></div>}
      <div><label htmlFor="nim" className="mb-2 block text-sm font-semibold">NIM</label><input id="nim" required pattern="[0-9]{5,20}" inputMode="numeric" maxLength={20} autoComplete="username" value={form.nim} onChange={e => setForm({ ...form, nim: e.target.value })} className="auth-input" /><p className="mt-1 text-xs text-slate-500">5–20 digit angka</p></div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Kata sandi</label><input id="password" type="password" required minLength={signup ? 8 : 1} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="auth-input" />{signup && <p className="mt-1 text-xs text-slate-500">Minimal 8 karakter</p>}</div>
      <button disabled={busy} className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Memproses..." : signup ? "Daftar" : "Masuk"}</button>
    </form>
    <button type="button" disabled={busy} onClick={() => { setSignup(!signup); setError(""); setForm({ ...form, password: "" }); }} className="mt-5 text-sm font-semibold text-blue-700">{signup ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar mahasiswa"}</button>
  </section>;
}
