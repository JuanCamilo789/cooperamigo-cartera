import { useApp } from '../lib/AppContext'
import { cop, fmtDate, today } from '../lib/utils'

const KPI = ({ label, value, sub, accent }) => {
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

export default function Dashboard({ onNav }) {
  const { cartera, processCSV, fechaCorte } = useApp()

  // ── MÉTRICAS CORRECTAS ──────────────────────────────────────────────

  // Cartera total
  const totalCap = cartera.reduce((s, r) => s + (r.saldocapit || 0), 0)

  // % Mora = saldo de categorías B+C+D+E / saldo total * 100
  const enMora    = cartera.filter(r => ['B','C','D','E'].includes(r.categoriaf))
  const saldoMora = enMora.reduce((s, r) => s + (r.saldocapit || 0), 0)
  const pctMora   = totalCap ? (saldoMora / totalCap * 100).toFixed(2) : '0.00'

  // Saldo por ponerse al día = suma saldoponer de quienes tienen diasmora > 0
  const saldoPoner = cartera
    .filter(r => (r.diasmora || 0) > 0)
    .reduce((s, r) => s + (r.saldoponer || 0), 0)

  // Cobros hoy: raportes es el DÍA DEL MES de pago recurrente
  // Si raportes == día de hoy → ese crédito cobra hoy
  // Fallback: usar el día de fechadesem si no hay raportes
  const diaHoy = new Date().getDate()
  const cobrosHoy = cartera.filter(r => {
    if (r.raportes) return Number(r.raportes) === diaHoy
    if (r.fechadesem) return String(r.fechadesem).split('-')[2] && parseInt(String(r.fechadesem).split('-')[2]) === diaHoy
    return false
  })

  // Distribución por categoría
  const catData = ['A','B','C','D','E'].map(cat => ({
    cat,
    count: cartera.filter(r => r.categoriaf === cat).length,
    saldo: cartera.filter(r => r.categoriaf === cat).reduce((s, r) => s + (r.saldocapit || 0), 0),
  }))
  const catBarColor  = { A:'bg-emerald-400', B:'bg-amber-400', C:'bg-orange-400', D:'bg-red-400', E:'bg-red-600' }
  const catTextColor = { A:'text-emerald-700', B:'text-amber-700', C:'text-orange-700', D:'text-red-600', E:'text-red-700' }

  // Rangos de mora por saldo capital
  const rangos = [
    { label: 'Al día',  filter: r => (r.diasmora||0) === 0,                              color: 'bg-emerald-400' },
    { label: '1-30d',   filter: r => (r.diasmora||0) > 0  && (r.diasmora||0) <= 30,      color: 'bg-amber-400'   },
    { label: '31-60d',  filter: r => (r.diasmora||0) > 30 && (r.diasmora||0) <= 60,      color: 'bg-orange-400'  },
    { label: '61-90d',  filter: r => (r.diasmora||0) > 60 && (r.diasmora||0) <= 90,      color: 'bg-red-400'     },
    { label: '90d+',    filter: r => (r.diasmora||0) > 90,                               color: 'bg-red-600'     },
  ]

  // Top 10 mayor saldo en mora
  const top10 = [...cartera]
    .filter(r => (r.diasmora || 0) > 0)
    .sort((a, b) => b.saldocapit - a.saldocapit)
    .slice(0, 10)

  const catBadgeCls = { A:'bg-emerald-50 text-emerald-700', B:'bg-amber-50 text-amber-700', C:'bg-orange-50 text-orange-600', D:'bg-red-50 text-red-600', E:'bg-red-100 text-red-700' }

  const handleFile = (file) => {
    if (!file?.name.endsWith('.csv')) return
    const reader = new FileReader()
    reader.onload = e => processCSV(e.target.result)
    reader.readAsText(file, 'UTF-8')
  }

  // ── PANTALLA DE CARGA INICIAL ────────────────────────────────────────
  if (!cartera.length) return (
    <div className="page-enter">
      <label className="block border-2 border-dashed border-surface-300 hover:border-brand-300 bg-white hover:bg-brand-50/30 rounded-2xl p-16 text-center cursor-pointer transition-all duration-200 group">
        <input type="file" accept=".csv" className="hidden" onChange={e => { handleFile(e.target.files[0]); e.target.value='' }} />
        <div className="text-5xl mb-4 opacity-30 group-hover:opacity-50 transition-opacity">📂</div>
        <p className="text-slate-600 font-medium mb-1">Arrastra el plano de cartera aquí o <span className="text-brand-500">haz clic</span></p>
        <p className="font-mono text-xs text-slate-300 mt-3 max-w-lg mx-auto">
          Columnas requeridas: PAGARE · CEDULASOCI · NOMBRE · SALDOCAPIT · DIASMORA · CATEGORIAF · RAPORTES · ANUALIDAD · SALDOPONER
        </p>
      </label>
    </div>
  )

  return (
    <div className="page-enter space-y-5">

      {/* Banner cartera cargada */}
      <label className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 cursor-pointer hover:bg-emerald-100/60 transition-colors">
        <input type="file" accept=".csv" className="hidden" onChange={e => { handleFile(e.target.files[0]); e.target.value='' }} />
        <span className="text-emerald-500 text-lg">✓</span>
        <span className="text-sm font-medium text-emerald-700">{cartera.length} créditos cargados</span>
        <span className="font-mono text-xs text-emerald-600 bg-emerald-100 rounded-full px-2.5 py-0.5 border border-emerald-200">
          Corte: {fmtDate(fechaCorte)}
        </span>
        <span className="ml-auto text-xs text-emerald-500 font-mono">Clic para actualizar CSV →</span>
      </label>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <KPI
          label="Cartera Total"
          value={cop(totalCap)}
          sub={`${cartera.length} créditos`}
          accent="blue"
        />
        <KPI
          label="Asociados"
          value={new Set(cartera.map(r => r.cedulasoci)).size}
          sub="deudores únicos"
          accent="cyan"
        />
        <KPI
          label="% en Mora (B-E)"
          value={pctMora + '%'}
          sub={cop(saldoMora) + ' en B/C/D/E'}
          accent="red"
        />
        <KPI
          label="Por Ponerse al Día"
          value={cop(saldoPoner)}
          sub={`${enMora.length} créditos con mora`}
          accent="amber"
        />
        <KPI
          label="Cobros Hoy"
          value={cobrosHoy.length}
          sub={`día ${diaHoy} del mes`}
          accent="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5">

        {/* Distribución por categoría */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-5">
            Distribución por Categoría (saldo capital)
          </p>
          <div className="space-y-3">
            {catData.map(({ cat, count, saldo }) => {
              const pctVal = totalCap ? (saldo / totalCap * 100) : 0
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-bold w-5 ${catTextColor[cat]}`}>{cat}</span>
                  <div className="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${catBarColor[cat]} transition-all duration-700`} style={{ width: pctVal + '%' }} />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 w-8 text-right">{count}</span>
                  <span className="font-mono text-[11px] text-slate-500 w-28 text-right font-medium">{cop(saldo)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rangos de mora */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-5">
            Cartera por Rango de Mora (saldo capital)
          </p>
          <div className="space-y-3">
            {rangos.map(({ label, filter, color }) => {
              const grupo = cartera.filter(filter)
              const saldo = grupo.reduce((s, r) => s + (r.saldocapit || 0), 0)
              const pctVal = totalCap ? (saldo / totalCap * 100) : 0
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-400 w-14 text-right">{label}</span>
                  <div className="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: pctVal + '%' }} />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 w-8 text-right">{grupo.length}</span>
                  <span className="font-mono text-[11px] text-slate-500 w-28 text-right font-medium">{cop(saldo)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top 10 mayor saldo en mora */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 bg-surface-50">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Top 10 — Mayor Saldo Capital en Mora
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pagaré</th>
                <th>Nombre</th>
                <th className="text-right">Saldo Capital</th>
                <th className="text-right">Saldo x Poner</th>
                <th>Días Mora</th>
                <th>Cat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {top10.map((r, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="font-mono text-xs">{r.pagare}</td>
                  <td className="font-medium">{r.nombre}</td>
                  <td className="text-right font-mono text-xs font-semibold text-slate-700">{cop(r.saldocapit)}</td>
                  <td className="text-right font-mono text-xs text-amber-600">{cop(r.saldoponer)}</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-xs
                      ${(r.diasmora||0) > 180 ? 'bg-red-100 text-red-700'
                      : (r.diasmora||0) > 90  ? 'bg-red-50 text-red-600'
                      : (r.diasmora||0) > 60  ? 'bg-orange-50 text-orange-600'
                      : 'bg-amber-50 text-amber-700'}`}>
                      {r.diasmora}d
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-xs font-bold ${catBadgeCls[r.categoriaf] || ''}`}>
                      {r.categoriaf}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm">
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
