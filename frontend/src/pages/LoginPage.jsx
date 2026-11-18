import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Ticket, UserRound } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../services/api";

export default function LoginPage() {
  const { user, setUser, error: connectionError } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setUser(await login(form));
    } catch (err) {
      setError(err.response?.data?.message || (err.response
        ? "Server gagal memproses login."
        : "API tidak dapat dijangkau. Pastikan backend berjalan."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="grid flex-1 bg-white lg:grid-cols-2" aria-labelledby="staff-login-title">
      <div className="relative isolate flex flex-col justify-center overflow-hidden bg-blue-950 px-6 py-8 text-white sm:px-10 lg:px-[8vw] lg:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,_#2563eb,_transparent_68%)]" />
        <div className="flex items-center gap-3 text-sm font-semibold text-blue-100">
          <span className="rounded-xl bg-white/15 p-2.5"><Ticket size={21} aria-hidden="true" /></span>
          QueueEase
        </div>
        <p className="mt-4 max-w-lg text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:mt-8 lg:text-6xl">Loket layanan akademik</p>
        <div aria-hidden="true" className="relative mt-10 hidden h-40 max-w-xs items-center justify-center lg:flex">
          <div className="absolute h-24 w-52 -rotate-12 rounded-2xl border border-blue-300/50 bg-blue-400/15" />
          <div className="relative flex h-24 w-52 rotate-6 items-center justify-between rounded-2xl border border-blue-300/50 bg-blue-700 px-5 shadow-xl shadow-blue-950/30">
            <Ticket size={34} className="text-blue-100" />
            <span className="h-14 border-l border-dashed border-blue-200/70" />
            <span className="flex flex-col gap-2"><span className="h-2 w-14 rounded-full bg-blue-200/80" /><span className="h-2 w-9 rounded-full bg-blue-300/60" /></span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-col justify-center px-6 py-10 sm:px-10 lg:py-12">
        <h2 id="staff-login-title" className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Masuk sebagai petugas</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Gunakan akun petugas untuk mengelola antrean di loket.</p>
        {(error || connectionError) && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error || connectionError}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-800">Username</label>
            <div className="relative">
              <UserRound size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="username" required maxLength={32} autoComplete="username" autoCapitalize="none" spellCheck={false}
                value={form.username} onChange={event => setForm({ ...form, username: event.target.value })}
                className="auth-input bg-slate-50 pl-11" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">Kata sandi</label>
            <div className="relative">
              <LockKeyhole size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="password" type={showPassword ? "text" : "password"} required maxLength={128}
                autoComplete="current-password" value={form.password}
                onChange={event => setForm({ ...form, password: event.target.value })}
                className="auth-input bg-slate-50 pl-11 pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-controls="password" className="absolute inset-y-1 right-1 inline-flex w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-800">
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50">
            {busy ? "Sedang masuk…" : "Masuk ke panel petugas"}
            {!busy && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        </form>
        <Link to="/" className="mt-5 inline-flex self-start items-center gap-2 rounded text-sm font-semibold text-blue-800 hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke antrean mahasiswa
        </Link>
      </div>
    </section>
  );
}
