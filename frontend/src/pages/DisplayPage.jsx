import { useEffect, useState } from "react";
import { DoorOpen, Maximize, Minimize, Pause, Play, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { getDisplayQueue } from "../services/api";

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "full" });
const notice = "Perhatikan nomor antrean pada layar. Jika nomor Anda terlewat, hubungi petugas loket.";

export default function DisplayPage() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [fullscreenError, setFullscreenError] = useState(false);
  const [tickerPaused, setTickerPaused] = useState(false);

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
    <main className="flex min-h-dvh flex-col bg-[#f8f6f0] text-[#14213a]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#14213a] px-5 py-4 sm:px-8 xl:px-[4vw]">
        <Link to="/" aria-label="QueueEase — kembali ke halaman antrean" className="inline-flex items-center gap-3 rounded">
          <span className="flex size-11 items-center justify-center bg-[#14213a] text-white"><Ticket size={24} aria-hidden="true" /></span>
          <span>
            <span className="block text-xl font-extrabold leading-tight">QueueEase</span>
            <span className="block text-sm font-medium">Layanan akademik</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="sm:flex sm:items-center sm:gap-5">
            <p className="text-xl font-black tabular-nums sm:text-3xl">{timeFormat.format(now)}</p>
            <p className="text-sm font-medium">{dateFormat.format(now)}</p>
          </div>
          {document.fullscreenEnabled && (
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Keluar dari layar penuh" : "Layar penuh"} title={fullscreen ? "Keluar dari layar penuh" : "Layar penuh"} className="border border-[#14213a] p-2.5 hover:bg-[#14213a] hover:text-white">
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          )}
        </div>
      </header>

      {error && <p role="alert" className="bg-amber-200 px-5 py-3 font-semibold text-amber-950 sm:px-8">Koneksi terputus. Layar akan mencoba terhubung kembali.</p>}
      {fullscreenError && <p role="status" className="px-5 py-2 text-sm text-red-800 sm:px-8">Browser gagal membuka layar penuh.</p>}

      <section className="flex flex-1 flex-col justify-center gap-5 px-5 py-10 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:py-12 xl:px-[4vw]">
        <div aria-live="polite" aria-atomic="true">
          <h1 className="text-base font-black uppercase tracking-[0.18em] text-blue-800 sm:text-xl">Nomor dipanggil</h1>
          <p className={`mt-3 break-all font-black leading-[0.87] tracking-[-0.075em] tabular-nums ${current?.ticket?.length > 4 ? "text-[clamp(3rem,9vw,10rem)]" : "text-[clamp(4.6rem,16vw,17rem)]"}`}>{current?.ticket || "—"}</p>
          <p className="mt-5 text-xl font-bold sm:text-3xl xl:text-4xl">{current?.keperluan || emptyMessage}</p>
        </div>
        <div className="flex min-w-0 items-center gap-4 border-t-2 border-[#14213a] pt-5 lg:border-l-2 lg:border-t-0 lg:py-8 lg:pl-8 xl:pl-12">
          {current ? (
            <>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] sm:text-lg">Silakan menuju</p>
                <p className="mt-1 whitespace-nowrap text-[clamp(2.25rem,4.8vw,6rem)] font-black tracking-tight">Loket 1</p>
              </div>
              <DoorOpen className="ml-auto size-12 shrink-0 bg-[#ffda5a] p-2.5 sm:size-20 sm:p-4" aria-hidden="true" />
            </>
          ) : (
            <p className="text-lg font-semibold">Panggilan akan muncul di layar ini.</p>
          )}
        </div>
      </section>

      <section className="border-t-2 border-[#14213a] px-5 py-5 sm:px-8 xl:px-[4vw]" aria-labelledby="upcoming-display">
        <h2 id="upcoming-display" className="text-sm font-black uppercase tracking-[0.18em] sm:text-base">Antrean berikutnya</h2>
        {upcoming.length > 0 ? (
          <ol className="mt-3 grid grid-cols-2 border-l border-t border-[#14213a]/30 sm:grid-cols-3 lg:flex">
            {upcoming.map(item => (
              <li key={item.ticket} className="min-w-0 flex-1 border-b border-r border-[#14213a]/30 px-3 py-3 sm:px-4">
                <strong className="block break-all text-2xl font-black leading-none tabular-nums sm:text-4xl xl:text-5xl">{item.ticket}</strong>
                <span className="mt-2 block text-sm font-medium sm:text-base">{item.keperluan}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-base font-medium">{error ? "Antrean belum dapat dimuat." : board ? "Belum ada antrean menunggu." : "Memuat antrean…"}</p>
        )}
      </section>

      <footer className="relative flex min-w-0 items-stretch bg-[#14213a] text-white">
        <span className="z-10 flex shrink-0 items-center bg-[#ffda5a] px-3 py-3 text-xs font-black uppercase tracking-wider text-[#14213a] sm:px-6 sm:text-sm">Informasi</span>
        <p className={`min-w-0 flex-1 px-3 py-3 text-sm font-medium sm:px-5 sm:text-base ${tickerPaused ? "" : "sr-only motion-reduce:not-sr-only"}`}>{notice}</p>
        {!tickerPaused && (
          <div aria-hidden="true" className="min-w-0 flex-1 overflow-hidden motion-reduce:hidden">
            <div className="display-ticker flex w-max whitespace-nowrap text-sm font-medium sm:text-base">
              <span className="min-w-[100vw] shrink-0 px-5 py-3">{notice}</span>
              <span className="min-w-[100vw] shrink-0 px-5 py-3">{notice}</span>
            </div>
          </div>
        )}
        <button type="button" onClick={() => setTickerPaused(!tickerPaused)} aria-label={tickerPaused ? "Jalankan teks informasi" : "Jeda teks informasi"}
          title={tickerPaused ? "Jalankan teks informasi" : "Jeda teks informasi"}
          className="z-10 flex shrink-0 items-center justify-center border-l border-white/30 px-3 hover:bg-white/15 motion-reduce:hidden sm:px-5">
          {tickerPaused ? <Play size={19} /> : <Pause size={19} />}
        </button>
      </footer>
    </main>
  );
}
