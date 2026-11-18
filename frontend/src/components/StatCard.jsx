export default function StatCard({ label, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-h-9 items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <span className={`shrink-0 rounded-xl p-1.5 sm:p-2 ${tones[tone]}`}><Icon size={19} /></span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 tabular-nums">{value ?? 0}</p>
    </div>
  );
}
