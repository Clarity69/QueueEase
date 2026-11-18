import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getQueue } from "../services/api";
import StatusBadge from "../components/StatusBadge";
export default function DashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const data = await getQueue(); if (active) { setRows(data); setError(""); } }
      catch { if (active) setError("Gagal memuat antrean. Periksa koneksi Anda."); }
      finally { if (active) setLoading(false); }
    };
    refresh(); const timer = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  const mine = rows.filter(row => row.user_id === user.id);
  const called = rows.find(row => row.status === "called");
  return <div className="space-y-6">
    <div><p className="text-sm font-semibold text-blue-600">DASBOR MAHASISWA</p><h2 className="mt-1 text-3xl font-bold">Nomor antrean Anda</h2><p className="mt-2 text-sm text-slate-500">{user.nama} · NIM {user.nim} · Diperbarui setiap 5 detik</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <div className="rounded-2xl bg-blue-700 p-7 text-white"><p>Sedang dipanggil</p><p className="my-3 text-6xl font-black">{called?.ticket || "—"}</p><p className="text-sm text-blue-100">{rows.filter(row => row.status === "waiting").length} antrean menunggu</p></div>
    {loading ? <p role="status">Memuat antrean...</p> : mine.length === 0 ? <div className="rounded-2xl border bg-white p-7"><p>Anda belum mengambil nomor antrean hari ini.</p><Link className="mt-4 inline-block font-semibold text-blue-700" to="/">Ambil nomor antrean →</Link></div> : mine.map(ticket => <section key={ticket.id} className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between"><h3 className="font-bold">Tiket antrean hari ini</h3><StatusBadge status={ticket.status} /></div>
      <p className="my-4 text-5xl font-black text-blue-700">{ticket.ticket}</p>
      <p className="text-sm">{ticket.keperluan}</p>
      <p className="mt-3 text-sm text-slate-500">Kode unik</p><p className="break-all font-mono text-sm">{ticket.unique_code}</p>
      {ticket.status === "waiting" && <p className="mt-4 text-sm font-semibold text-blue-700">{rows.filter(row => row.queue_number < ticket.queue_number && row.status !== "done").length} antrean sebelum Anda</p>}
      {ticket.status === "called" && <p role="status" className="mt-4 font-semibold text-emerald-700">Silakan menuju loket pelayanan.</p>}
    </section>)}
  </div>;
}
