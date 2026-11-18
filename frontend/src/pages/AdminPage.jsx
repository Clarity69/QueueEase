import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, CheckCircle2, Clock3, FileCheck2, FileText, GraduationCap, ListOrdered, Megaphone, MoreHorizontal, PauseCircle, RefreshCw, SkipForward, Tv, Users, ArrowRight } from "lucide-react";
import { callNext, callTicket, completeQueue, getAdminQueue, getStats, requeueTicket, skipQueue, skipWaitingTicket } from "../services/api";
import { Link } from "react-router-dom";
import QueueTable from "../components/QueueTable";
import StatCard from "../components/StatCard";

const defaultCategories = new Map([
  ["Konsultasi Akademik", GraduationCap],
  ["Surat Aktif Kuliah", FileText],
  ["Legalisir Dokumen", FileCheck2],
  ["Pengajuan Cuti", PauseCircle],
  ["Lainnya", MoreHorizontal],
]);

export default function AdminPage() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, called: 0, done: 0 });
  const [message, setMessage] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [category, setCategory] = useState(null);

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

  const handleSkip = id => runAction(
    () => skipQueue(id),
    ({ skipped, current: called }) => called
      ? `Tiket ${skipped.ticket} dilewati. Nomor ${called.ticket} dipanggil.`
      : `Tiket ${skipped.ticket} dilewati. Belum ada antrean menunggu.`,
    "Gagal melewati antrean."
  );
  const handleCallTicket = id => runAction(
    () => callTicket(id),
    ({ current: called, previousTicket }) => previousTicket
      ? `Nomor ${called.ticket} dipanggil. Tiket ${previousTicket} kembali menunggu.`
      : `Nomor ${called.ticket} dipanggil.`,
    "Gagal memanggil nomor yang dipilih."
  );
  const handleSkipWaiting = id => runAction(
    () => skipWaitingTicket(id),
    ticket => `Tiket ${ticket.ticket} dilewati.`,
    "Gagal melewati tiket yang menunggu."
  );
  const handleRequeue = id => runAction(
    () => requeueTicket(id),
    ticket => `Tiket ${ticket.ticket} kembali ke antrean.`,
    "Gagal mengembalikan tiket ke antrean."
  );

  const current = rows.find(row => row.status === "called");
  const next = rows.find(row => row.status === "waiting");
  const updatedTime = lastUpdated?.toLocaleTimeString("id-ID");
  const categories = new Map([...defaultCategories].map(([name, Icon]) => [name, { Icon, total: 0, waiting: 0 }]));
  let skippedCount = 0;
  for (const row of rows) {
    const summary = categories.get(row.keperluan) || { Icon: MoreHorizontal, total: 0, waiting: 0 };
    summary.total++;
    if (row.status === "waiting") summary.waiting++;
    if (row.status === "skipped") skippedCount++;
    categories.set(row.keperluan, summary);
  }

  const visibleRows = category === null ? rows : rows.filter(row => row.keperluan === category);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Panel petugas</h2>
          <p className="mt-2 text-sm text-slate-600">Kelola antrean layanan akademik hari ini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <RefreshCw size={15} /> {updatedTime ? `Diperbarui pukul ${updatedTime}` : "Pembaruan otomatis setiap 5 detik"}
          </p>
          <Link to="/display" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">
            <Tv size={17} /> Buka layar TV
          </Link>
        </div>
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
          {current && (
            <div className="px-6 pb-4 sm:px-8">
              <button type="button" onClick={() => handleSkip(current.id)} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">
                <SkipForward size={17} /> Lewati {current.ticket}
              </button>
            </div>
          )}
          {current && next && <p className="px-6 pb-5 text-xs text-slate-600 sm:px-8">Tiket {current.ticket} otomatis selesai saat nomor berikutnya dipanggil.</p>}
        </section>

        <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Ringkasan antrean">
          <StatCard label="Total antrean" value={stats.total} icon={Users} tone="slate" />
          <StatCard label="Menunggu" value={stats.waiting} icon={Clock3} tone="amber" />
          <StatCard label="Dipanggil" value={stats.called} icon={Megaphone} tone="blue" />
          <StatCard label="Selesai" value={stats.done} icon={CheckCircle2} tone="green" />
        </div>
      </div>

      <section aria-labelledby="service-summary" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="service-summary" className="text-lg font-bold tracking-tight text-slate-950">Kategori layanan</h3>
          <button type="button" aria-pressed={category === null} aria-controls="queue-list"
            onClick={() => setCategory(null)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${category === null ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
            Semua kategori
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {[...categories].map(([name, { Icon, total, waiting }]) => (
            <button key={name} type="button" aria-pressed={category === name} aria-controls="queue-list"
              onClick={() => setCategory(name)}
              className={`flex min-w-0 flex-col items-start rounded-2xl border px-4 py-4 text-left transition-colors ${category === name ? "border-blue-600 bg-blue-50 ring-1 ring-inset ring-blue-600" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"}`}>
              <span className="flex w-full items-center justify-between gap-2">
                <span className="rounded-lg bg-blue-100 p-2 text-blue-800"><Icon size={16} aria-hidden="true" /></span>
                <ArrowRight size={16} className="text-blue-600" aria-hidden="true" />
              </span>
              <span className="mt-3 min-h-10 text-sm font-semibold leading-5 text-slate-900">{name}</span>
              <span className="mt-1 text-xl font-bold tabular-nums text-slate-950">{updatedTime ? total : "—"} <span className="text-xs font-medium text-slate-600">tiket</span></span>
              <span className="mt-1 text-xs font-medium text-slate-600">{updatedTime ? `${waiting} menunggu` : "Belum dimuat"}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="queue-list" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-6 py-5">
          <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950"><ListOrdered size={19} className="text-blue-700" /> Daftar antrean</h3>
          <p role="status" className="text-sm text-slate-600">
            {category || "Semua kategori"}{updatedTime && ` · ${visibleRows.length} tiket`}
            {category === null && skippedCount > 0 && ` · ${skippedCount} dilewati`}
          </p>
        </div>
        {current && <p className="border-b border-slate-100 px-6 py-3 text-xs text-slate-600">Memanggil tiket dari daftar akan mengembalikan {current.ticket} ke status menunggu.</p>}
        {updatedTime ? (
          <QueueTable rows={visibleRows} onCall={handleCallTicket} onSkip={handleSkipWaiting} emptyMessage={category ? `Belum ada antrean untuk ${category} hari ini.` : undefined} showAction actionsDisabled={busy} onComplete={handleComplete} onRequeue={handleRequeue} />
        ) : (
          <p role="status" className="p-6 text-sm text-slate-600">{refreshError ? "Daftar antrean belum dapat dimuat." : "Memuat daftar antrean…"}</p>
        )}
      </section>
    </div>
  );
}
