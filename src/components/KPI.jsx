export default function KPI({ label, value, sub, accent }) {
  const accentMap = {
    blue:  { bar: 'from-brand-400 to-blue-300',  val: 'text-brand-600' },
    red:   { bar: 'from-red-400 to-rose-300',     val: 'text-red-500' },
    amber: { bar: 'from-amber-400 to-yellow-300', val: 'text-amber-600' },
    green: { bar: 'from-emerald-400 to-teal-300', val: 'text-emerald-600' },
    cyan:  { bar: 'from-cyan-400 to-sky-300',     val: 'text-cyan-600' },
  }
  const a = accentMap[accent] ?? accentMap.blue
  return (
    <div className="kpi-card">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${a.bar}`} />
      <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-slate-400 mb-2">{label}</p>
      <p className={`font-display font-bold text-2xl tracking-tight leading-none ${a.val}`}>{value}</p>
      {sub && <p className="font-mono text-[11px] text-slate-400 mt-1.5">{sub}</p>}
    </div>
  )
}