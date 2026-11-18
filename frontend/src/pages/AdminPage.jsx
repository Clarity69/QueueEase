import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, CheckCircle2, Clock3, ListOrdered, Megaphone, RefreshCw, Users } from "lucide-react";
import { callNext, completeQueue, getAdminQueue, getStats } from "../services/api";
import QueueTable from "../components/QueueTable";
import StatCard from "../components/StatCard";

export default function AdminPage() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, called: 0, done: 0 });
  const [message, setMessage] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshSequence = useRef(0);
  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    try {
      const [queueData, statsData] = await Promise.all([getAdminQueue(), getStats()]);
      if (sequence !== refreshSequence.current) return;
      setRows(queueData);
      setStats(statsData);
      setRefreshError("");
      setLastUpdated(new Date());
    } catch {
      if (sequence === refreshSequence.current) setRefreshError("Gagal memuat data antrean.");
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => {
      clearInterval(timer);
      refreshSequence.current++;
    };
  }, [refresh]);

  const runAction = async (action, successMessage, errorMessage) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      setMessage(successMessage(result));
      await refresh();
    } catch (error) {
      setMessage(error.response?.data?.message || errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const handleCallNext = () => runAction(
    callNext,
    called => `Nomor ${called.ticket} berhasil dipanggil.`,
    "Gagal memanggil antrean."
  );
  const handleComplete = id => runAction(
    () => completeQueue(id),
    () => "Antrean berhasil diselesaikan.",
    "Gagal menyelesaikan antrean."
  );

  const current = rows.find(row => row.status === "called");
  const next = rows.find(row => row.status === "waiting");
  const updatedTime = lastUpdated?.toLocaleTimeString("id-ID");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Panel petugas</h2>
          <p className="mt-2 text-sm text-slate-600">Kelola antrean layanan akademik hari ini.</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw size={15} /> {updatedTime ? `Diperbarui pukul ${updatedTime}` : "Pembaruan otomatis setiap 5 detik"}
        </p>
      </header>

      {refreshError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{refreshError}</p>}
      {message && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{message}</p>}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-blue-950 px-6 py-6 text-white sm:px-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-100"><Activity size={17} /> Sedang dipanggil</h3>
            <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
              <p className="text-6xl font-black tracking-tight tabular-nums">{current?.ticket || "—"}</p>
              <div className="min-w-0 pb-1">
                <p className="break-words font-semibold">{current?.nama || "Belum ada panggilan"}</p>
                {current && <p className="mt-0.5 text-sm text-blue-100">{current.keperluan}</p>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8">
            <div>
              <p className="text-xs font-semibold text-slate-600">Berikutnya</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{next ? `${next.ticket} · ${next.keperluan}` : "Belum ada antrean menunggu"}</p>
            </div>
            <button type="button" onClick={handleCallNext} disabled={busy || !next} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
              <Megaphone size={17} /> Panggil berikutnya
            </button>
          </div>
          {current && next && <p className="px-6 pb-5 text-xs text-slate-600 sm:px-8">Tiket {current.ticket} otomatis selesai saat nomor berikutnya dipanggil.</p>}
        </section>

        <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Ringkasan antrean">
          <StatCard label="Total antrean" value={stats.total} icon={Users} tone="slate" />
          <StatCard label="Menunggu" value={stats.waiting} icon={Clock3} tone="amber" />
          <StatCard label="Dipanggil" value={stats.called} icon={Megaphone} tone="blue" />
          <StatCard label="Selesai" value={stats.done} icon={CheckCircle2} tone="green" />
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-6 py-5">
          <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950"><ListOrdered size={19} className="text-blue-700" /> Daftar antrean</h3>
          <p className="text-sm text-slate-600">Urutan kedatangan</p>
        </div>
        {updatedTime || refreshError ? (
          <QueueTable rows={rows} showAction actionsDisabled={busy} onComplete={handleComplete} />
        ) : (
          <p role="status" className="p-6 text-sm text-slate-600">Memuat daftar antrean…</p>
        )}
      </section>
    </div>
  );
}
