import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Megaphone, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { getQueue } from "../services/api";
import StatusBadge from "../components/StatusBadge";

export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const data = await getQueue();
        if (active) {
          setRows(data);
          setError("");
        }
      } catch {
        if (active) setError("Gagal memuat antrean. Periksa koneksi Anda.");
      } finally {
        if (active) setLoading(false);
      }
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const ticket = rows.find(row => row.is_mine);
  const called = rows.find(row => row.status === "called");
  const waiting = rows.filter(row => row.status === "waiting").length;
  const ahead = ticket?.status === "waiting" ? rows.filter(
    row => row.queue_number < ticket.queue_number && row.status !== "done"
  ).length : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Antrean saya</h2>
          <p className="mt-2 text-sm text-slate-600">Pantau tiket layanan akademik hari ini.</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-600"><Clock3 size={16} /> Diperbarui setiap 5 detik</p>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
        <section aria-label="Tiket Anda" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p role="status" className="p-7 text-slate-600">Memuat tiket…</p>
          ) : ticket ? (
            <>
              <div className="bg-blue-950 px-6 py-7 text-white sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-100"><Ticket size={18} /> Tiket antrean hari ini</h3>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-5 text-6xl font-black tracking-tight tabular-nums sm:text-7xl">{ticket.ticket}</p>
                <p className="mt-2 text-sm font-medium text-blue-100">{ticket.keperluan}</p>
              </div>
              <div className="space-y-5 px-6 py-6 sm:px-8">
                {ticket.status === "waiting" && (
                  <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
                    {ahead ? `${ahead} antrean sebelum Anda` : "Tidak ada antrean di depan Anda."}
                  </p>
                )}
                {ticket.status === "called" && (
                  <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">Silakan menuju loket pelayanan.</p>
                )}
                {ticket.status === "done" && <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Ambil antrean baru <ArrowRight size={16} /></Link>}
                <dl className="space-y-3 border-t border-dashed border-slate-200 pt-4 text-sm">
                  <div><dt className="font-semibold text-slate-800">Pemegang tiket</dt><dd className="mt-1 break-words text-slate-600">{ticket.nama} · NIM {ticket.nim}</dd></div>
                  <div><dt className="font-semibold text-slate-800">Kode unik</dt><dd className="mt-1 break-all font-mono text-xs text-slate-600">{ticket.unique_code}</dd></div>
                </dl>
              </div>
            </>
          ) : (
            <div className="p-7 sm:p-8">
              <span className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-700"><Ticket size={22} /></span>
              <h3 className="mt-4 text-xl font-bold text-slate-950">{error ? "Tiket belum dapat dimuat" : "Belum ada tiket di browser ini"}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Tiket bisa dipantau dari browser yang dipakai saat mengambil antrean.</p>
              <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">Ambil nomor antrean <ArrowRight size={16} /></Link>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><Megaphone size={17} className="text-blue-700" /> Sedang dipanggil</h3>
          <p className="mt-4 text-5xl font-extrabold tracking-tight text-blue-800 tabular-nums">{called?.ticket || "—"}</p>
          <p className="mt-2 text-sm text-slate-600">{called?.keperluan || "Belum ada panggilan di loket."}</p>
          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-700">
            <span>Antrean menunggu</span><strong className="text-slate-950 tabular-nums">{waiting}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
