import StatusBadge from "./StatusBadge";

export default function QueueTable({ rows, onComplete, onRequeue, showAction = false, actionsDisabled = false }) {
  if (!rows.length) {
    return <div className="p-10 text-center text-sm text-slate-500">Belum ada antrean hari ini.</div>;
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
                  {row.status === "skipped" && (
                    <button type="button" disabled={actionsDisabled} aria-label={`Kembalikan tiket ${row.ticket} ke antrean`} onClick={() => onRequeue(row.id)} className="mb-1 mr-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50">
                      Kembalikan
                    </button>
                  )}
                  {row.status !== "done" && (
                    <button type="button" disabled={actionsDisabled} aria-label={`Selesaikan tiket ${row.ticket}`} onClick={() => onComplete(row.id)} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">
                      Selesaikan
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
