import StatusBadge from "./StatusBadge";

const actionClass = "rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50";

export default function QueueTable({ rows, onCall, onSkip, onComplete, onRequeue, showAction = false, actionsDisabled = false, emptyMessage = "Belum ada antrean hari ini." }) {
  if (!rows.length) {
    return <div className="p-10 text-center text-sm text-slate-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto" role="region" aria-label="Tabel antrean" tabIndex={0}>
      <table className={`w-full text-left text-sm ${showAction ? "min-w-[620px]" : "min-w-[360px]"}`}>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4">Nomor</th>
            {showAction && <th className="px-5 py-4">Nama / NIM</th>}
            <th className="px-5 py-4">Keperluan</th>
            <th className="px-5 py-4">Status</th>
            {showAction && <th className="sticky right-0 bg-slate-50 px-3 py-4 sm:static sm:px-5">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/70">
              <td className="px-5 py-4 font-bold text-blue-700">{row.ticket}</td>
              {showAction && <td className="px-5 py-4 font-medium text-slate-800">{row.nama || "Mahasiswa"}{row.nim && <span className="mt-1 block text-xs text-slate-500">{row.nim}</span>}</td>}
              <td className="px-5 py-4 text-slate-600">{row.keperluan}</td>
              <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
              {showAction && (
                <td className="sticky right-0 bg-white px-3 py-4 sm:static sm:bg-transparent sm:px-5">
                  <div className="flex flex-wrap gap-1.5 max-sm:max-w-36">
                    {(row.status === "waiting" || row.status === "skipped") && (
                      <button type="button" disabled={actionsDisabled} aria-label={`Panggil tiket ${row.ticket}`} onClick={() => onCall(row.id)} className={`${actionClass} border-blue-700 bg-blue-700 text-white hover:bg-blue-800`}>
                        Panggil
                      </button>
                    )}
                    {row.status === "waiting" && (
                      <button type="button" disabled={actionsDisabled} aria-label={`Lewati tiket ${row.ticket}`} onClick={() => onSkip(row.id)} className={`${actionClass} border-amber-200 text-amber-900 hover:bg-amber-50`}>
                        Lewati
                      </button>
                    )}
                    {row.status === "skipped" && (
                      <button type="button" disabled={actionsDisabled} aria-label={`Kembalikan tiket ${row.ticket} ke antrean`} onClick={() => onRequeue(row.id)} className={`${actionClass} border-blue-200 text-blue-800 hover:bg-blue-50`}>
                        Kembalikan
                      </button>
                    )}
                    {row.status !== "done" && (
                      <button type="button" disabled={actionsDisabled} aria-label={`Selesaikan tiket ${row.ticket}`} onClick={() => onComplete(row.id)} className={`${actionClass} border-emerald-200 text-emerald-800 hover:bg-emerald-50`}>
                        Selesaikan
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
