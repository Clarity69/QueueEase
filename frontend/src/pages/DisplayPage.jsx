import { useEffect, useState } from "react";
import { Clock3, Maximize, Megaphone, Minimize, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { getDisplayQueue } from "../services/api";

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "full" });

export default function DisplayPage() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [fullscreenError, setFullscreenError] = useState(false);

  useEffect(() => {
    let active = true;
    let nextRefresh;
    const refresh = async () => {
      try {
        const data = await getDisplayQueue();
        if (active) {
          setBoard(data);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) nextRefresh = window.setTimeout(refresh, 5000);
      }
    };
    refresh();
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      active = false;
      window.clearTimeout(nextRefresh);
      window.clearInterval(clock);
      document.removeEventListener("fullscreenchange", updateFullscreen);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFullscreenError(false);
    } catch {
      setFullscreenError(true);
    }
  };

  const current = error ? null : board?.current;
  const upcoming = error ? [] : board?.upcoming || [];
  const emptyMessage = error ? "Menunggu koneksi ke server" : board ? "Belum ada panggilan" : "Memuat antrean…";

  return (
    <main className="flex min-h-screen flex-col gap-5 bg-slate-950 px-4 py-5 text-white sm:gap-8 sm:p-8 xl:px-[4vw]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-3 rounded-lg">
          <span className="rounded-xl bg-blue-400 p-3 text-slate-950"><Ticket size={24} /></span>
          <span>
            <span className="block text-lg font-bold sm:text-2xl">QueueEase</span>
            <span className="block text-sm text-slate-300">Layanan akademik</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p className="text-xl font-bold tabular-nums sm:text-3xl">{timeFormat.format(now)}</p>
            <p className="text-xs text-slate-300 sm:text-sm">{dateFormat.format(now)}</p>
          </div>
          {document.fullscreenEnabled && (
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Keluar dari layar penuh" : "Layar penuh"} title={fullscreen ? "Keluar dari layar penuh" : "Layar penuh"} className="rounded-xl border border-slate-600 p-3 text-slate-200 hover:bg-slate-800">
              {fullscreen ? <Minimize size={21} /> : <Maximize size={21} />}
            </button>
          )}
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl bg-amber-100 px-4 py-3 font-semibold text-amber-950">Koneksi terputus. Layar akan mencoba terhubung kembali.</p>}
      {fullscreenError && <p role="status" className="text-sm text-amber-200">Browser gagal membuka layar penuh.</p>}

      <div className="grid flex-1 gap-5 lg:grid-cols-[1.7fr_1fr] xl:gap-8">
        <section className="flex min-h-[18rem] flex-col justify-between rounded-3xl bg-blue-700 p-6 sm:p-9 xl:p-[3vw]">
          <div className="flex items-center justify-between gap-4">
            <h1 className="flex items-center gap-3 text-base font-bold text-blue-100 sm:text-2xl"><Megaphone size={24} /> Sedang dipanggil</h1>
            <span className="rounded-xl bg-blue-800 px-3 py-2 text-sm font-bold sm:px-4 sm:text-lg">Loket 1</span>
          </div>
          <div aria-live="polite" aria-atomic="true" className="py-8">
            <p className="text-[clamp(5rem,14vw,16rem)] font-black leading-none tracking-tight tabular-nums">{current?.ticket || "—"}</p>
            <p className="mt-3 text-xl font-semibold text-blue-100 sm:text-3xl">{current?.keperluan || emptyMessage}</p>
          </div>
          <p className="min-h-7 text-base font-medium text-blue-100 sm:text-xl">{current ? "Silakan menuju loket pelayanan" : "Panggilan akan muncul di layar ini"}</p>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-7 xl:p-[2vw]">
          <h2 className="mb-5 flex items-center gap-3 text-lg font-bold sm:text-2xl"><Clock3 size={22} className="text-blue-300" /> Antrean berikutnya</h2>
          {upcoming.length ? (
            <ol className="space-y-2.5">
              {upcoming.map(item => (
                <li key={item.ticket} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl bg-slate-800 px-4 py-3 sm:flex-nowrap sm:px-5">
                  <strong className="text-2xl font-extrabold leading-none text-blue-200 tabular-nums sm:text-4xl">{item.ticket}</strong>
                  <span className="text-sm text-slate-200 sm:text-right sm:text-base xl:text-lg">{item.keperluan}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl bg-slate-800 px-4 py-5 text-base text-slate-300">
              {error ? "Antrean belum dapat dimuat." : board ? "Belum ada antrean menunggu." : "Memuat antrean…"}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
