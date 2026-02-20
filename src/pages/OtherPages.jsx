import { useApp } from '../lib/AppContext'
import { cop, fmtDate, today, calcCat, dlCSV } from '../lib/utils'

// ───── ALERTAS ─────
export function Alertas() {
  const { cartera, gestiones } = useApp()
  const hoy = new Date()

  const alerts = []

  // Cat D/E
  const de = cartera.filter(r => ['D','E'].includes(r.categoriaf))
  if (de.length) alerts.push({ type: 'crit', title: `${de.length} créditos en categoría D o E`, detail: `Saldo en riesgo: ${cop(de.reduce((s,r)=>s+(r.saldocapit||0),0))}` })

  // Sin gestión +7 días
  const sinGest = cartera.filter(r => r.diasmora > 0).filter(r => {
    const ult = gestiones.filter(g => g.pagare === r.pagare).sort((a,b) => new Date(b.fecha_gestion) - new Date(a.fecha_gestion))[0]
    return !ult || (hoy - new Date(ult.fecha_gestion)) / 864e5 > 7
  })
  if (sinGest.length) alerts.push({ type: 'warn', title: `${sinGest.length} créditos sin gestión en +7 días`, detail: cop(sinGest.reduce((s,r)=>s+(r.saldocapit||0),0))+' en mora sin contacto reciente' })

  // Rodamiento
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0)
  const diasRest = Math.floor((finMes-hoy)/864e5)
  const rod = cartera.filter(r => r.diasmora > 0 && calcCat(r.diasmora+diasRest) !== r.categoriaf)
  if (rod.length) alerts.push({ type: 'info', title: `${rod.length} créditos rodarán de categoría al cierre`, detail: `${diasRest} días para el cierre del mes` })

  const borderMap = { crit: 'border-l-red-400', warn: 'border-l-amber-400', info: 'border-l-brand-400' }
  const dotMap    = { crit: 'bg-red-400', warn: 'bg-amber-400', info: 'bg-brand-400' }

  return (
    <div className="page-enter space-y-3">
      {alerts.length === 0 && (
        <div className="text-center py-20 text-slate-300">
          <div className="text-5xl opacity-20 mb-3">✅</div>
          <p className="text-slate-400">Sin alertas críticas. ¡Cartera saludable!</p>
        </div>
      )}
      {alerts.map((a, i) => (
        <div key={i} className={`bg-white border border-surface-200 border-l-4 ${borderMap[a.type]} rounded-xl px-5 py-4 flex items-start gap-4 shadow-card`}>
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotMap[a.type]}`} />
          <div>
            <p className="font-semibold text-slate-700">{a.title}</p>
            <p className="font-mono text-xs text-slate-400 mt-1">{a.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ───── COBROS HOY ─────
export function CobrosHoy({ onNav }) {
  const { cartera } = useApp()
  const hoy = today()
  const [, m, d] = hoy.split('-')

  const cobros = cartera.filter(r => {
    if (!r.fechadesem) return false
    const dt = new Date(r.fechadesem)
    return String(dt.getUTCDate()).padStart(2,'0') === d && String(dt.getUTCMonth()+1).padStart(2,'0') === m
  }).sort((a,b) => b.anualidad - a.anualidad)

  if (!cobros.length) return (
    <div className="page-enter text-center py-20">
      <div className="text-5xl opacity-20 mb-3">📅</div>
      <p className="text-slate-400">No hay créditos con vencimiento hoy</p>
    </div>
  )

  return (
    <div className="page-enter space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-2">
          <p className="font-mono text-xs text-brand-600">{cobros.length} cobros · {cop(cobros.reduce((s,r)=>s+(r.anualidad||0),0))} esperado hoy</p>
        </div>
      </div>
      {cobros.map((r, i) => (
        <div key={i} className="bg-white border border-surface-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 text-lg flex-shrink-0">
            {r.formapago === 'T' ? '🏦' : '📋'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-slate-800">{r.nombre}</p>
            <p className="font-mono text-xs text-slate-400 mt-0.5">{r.pagare} · {r.formapago === 'T' ? 'Taquilla' : 'Nómina'} · {r.periodocap === 'M' ? 'Mensual' : 'Quincenal'}</p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-lg text-brand-600">{cop(r.anualidad)}</p>
            {r.diasmora > 0 && <p className="font-mono text-xs text-red-500 mt-0.5">{r.diasmora}d mora</p>}
          </div>
          <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm ml-2">Gestionar</button>
        </div>
      ))}
    </div>
  )
}

// ───── VENCIDOS ─────
export function Vencidos({ onNav }) {
  const { cartera } = useApp()
  const vencidos = cartera.filter(r => r.diasmora > 0).sort((a,b) => b.diasmora - a.diasmora)

  const columns = [
    { key: 'pagare',    label: 'Pagaré',         render: r => <span className="font-mono text-xs">{r.pagare}</span> },
    { key: 'nombre',    label: 'Nombre',          render: r => <span className="font-medium">{r.nombre}</span> },
    { key: 'cedulasoci',label: 'Cédula',          render: r => <span className="font-mono text-xs">{r.cedulasoci}</span> },
    { key: 'saldocapit',label: 'Saldo Capital',   right: true, render: r => <span className="font-mono text-xs font-medium">{cop(r.saldocapit)}</span> },
    { key: 'diasmora',  label: 'Días Vencido',    render: r => (
        <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-xs ${r.diasmora > 90 ? 'bg-red-50 text-red-600' : r.diasmora > 60 ? 'bg-orange-50 text-orange-600' : 'bg-amber-50 text-amber-700'}`}>
          {r.diasmora}d
        </span>
      )
    },
    { key: 'fechadesem',label: 'Fecha Venc.',     render: r => <span className="font-mono text-xs">{fmtDate(r.fechadesem)}</span> },
    { key: 'categoriaf',label: 'Cat',             render: r => {
        const cls = { A:'bg-emerald-50 text-emerald-700', B:'bg-amber-50 text-amber-700', C:'bg-orange-50 text-orange-600', D:'bg-red-50 text-red-600', E:'bg-red-100 text-red-700' }
        return <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-xs font-bold ${cls[r.categoriaf]||''}`}>{r.categoriaf}</span>
      }
    },
    { key: 'accion', label: '', render: r => <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm">Gestionar</button> },
  ]

  return (
    <div className="page-enter">
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        {/* eslint-disable-next-line react/jsx-pascal-case */}
        <DataTable columns={columns} data={vencidos} emptyIcon="✅" emptyText="No hay créditos vencidos" />
      </div>
    </div>
  )
}

// ───── RODAMIENTO ─────
export function Rodamiento({ onNav }) {
  const { cartera } = useApp()
  const hoy = new Date()
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0)
  const diasRest = Math.floor((finMes - hoy) / 864e5)

  const rod = cartera.filter(r => r.diasmora > 0).map(r => ({
    ...r,
    diasFin: r.diasmora + diasRest,
    catFin: calcCat(r.diasmora + diasRest),
  })).filter(r => r.catFin !== r.categoriaf)

  const transitions = ['A→B','B→C','C→D','D→E'].map(t => {
    const [from, to] = t.split('→')
    const items = rod.filter(r => r.categoriaf === from && r.catFin === to)
    return { label: t, count: items.length, saldo: items.reduce((s,r)=>s+(r.saldocapit||0),0) }
  })

  const columns = [
    { key: 'pagare',    label: 'Pagaré',       render: r => <span className="font-mono text-xs">{r.pagare}</span> },
    { key: 'nombre',    label: 'Nombre',        render: r => <span className="font-medium">{r.nombre}</span> },
    { key: 'saldocapit',label: 'Saldo',         right: true, render: r => <span className="font-mono text-xs">{cop(r.saldocapit)}</span> },
    { key: 'diasmora',  label: 'Mora Hoy',      render: r => <span className="font-mono text-xs">{r.diasmora}d</span> },
    { key: 'diasFin',   label: 'Mora Fin Mes',  render: r => <span className="font-mono text-xs text-red-500">{r.diasFin}d</span> },
    { key: 'categoriaf',label: 'Cat Hoy',       render: r => <span className="font-mono text-xs font-bold">{r.categoriaf}</span> },
    { key: 'catFin',    label: 'Cat Fin Mes',   render: r => <span className="font-mono text-xs font-bold text-red-500">{r.catFin}</span> },
    { key: 'accion',    label: '',              render: r => <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm">Gestionar</button> },
  ]

  return (
    <div className="page-enter space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {transitions.map(t => (
          <div key={t.label} className="bg-white rounded-xl border border-surface-200 shadow-card p-5 text-center">
            <p className="font-mono text-xs tracking-widest text-slate-400 mb-2 uppercase">{t.label}</p>
            <p className="font-display font-bold text-3xl text-slate-700">{t.count}</p>
            <p className="font-mono text-xs text-slate-400 mt-1">{cop(t.saldo)}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-100 bg-surface-50">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Créditos que cambian de categoría al cierre — {diasRest} días restantes</p>
        </div>
        <DataTable columns={columns} data={rod} emptyIcon="🎉" emptyText="Ningún crédito cambia de categoría al cierre del mes" />
      </div>
    </div>
  )
}

// We need DataTable import
import DataTable from '../components/DataTable'

// ───── REPORTES ─────
export function Reportes() {
  const { cartera, gestiones } = useApp()
  const hoy = new Date()
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0)
  const diasRest = Math.floor((finMes-hoy)/864e5)

  const reports = [
    {
      icon: '📊',
      title: 'Reporte General de Cartera',
      desc: 'Todos los créditos del corte actual',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','CATEGORIAF','SALDOCAPIT','DIASMORA','SALDOPONER','ANUALIDAD','FORMAPAGO','PERIODOCAP','TASACOLOCA','FECHADESEM','PLAZO']
        dlCSV([h, ...cartera.map(r => h.map(k => r[k.toLowerCase()]??''))], 'general.csv')
      }
    },
    {
      icon: '⚠️',
      title: 'Cartera en Mora (B, C, D, E)',
      desc: 'Solo créditos con días de mora > 0',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','CATEGORIAF','SALDOCAPIT','DIASMORA','SALDOPONER']
        const d = cartera.filter(r => r.diasmora > 0)
        dlCSV([h, ...d.map(r => h.map(k => r[k.toLowerCase()]??''))], 'mora.csv')
      }
    },
    {
      icon: '🔴',
      title: 'Cartera de Mayor Riesgo (C, D, E)',
      desc: 'Créditos en categorías críticas',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','CATEGORIAF','SALDOCAPIT','DIASMORA','SALDOPONER']
        const d = cartera.filter(r => ['C','D','E'].includes(r.categoriaf))
        dlCSV([h, ...d.map(r => h.map(k => r[k.toLowerCase()]??''))], 'riesgo.csv')
      }
    },
    {
      icon: '🔄',
      title: 'Rodamiento del Mes',
      desc: 'Créditos que cambiarán de categoría al cierre',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','SALDOCAPIT','DIASMORA','CATEGORIA_ACTUAL','DIAS_FIN_MES','CATEGORIA_FIN_MES']
        const d = cartera.filter(r=>r.diasmora>0).map(r=>({...r,proy:r.diasmora+diasRest,catFin:calcCat(r.diasmora+diasRest)})).filter(r=>r.categoriaf!==r.catFin)
        dlCSV([h, ...d.map(r=>[r.pagare,r.nombre,r.cedulasoci,r.saldocapit,r.diasmora,r.categoriaf,r.proy,r.catFin])], 'rodamiento.csv')
      }
    },
    {
      icon: '✍️',
      title: 'Gestiones Registradas',
      desc: 'Historial completo de cobros',
      action: () => {
        const h = ['FECHA','PAGARE','NOMBRE','CANAL','RESULTADO','COMPROMISO','MONTO','OBSERVACIONES','GESTOR']
        dlCSV([h, ...gestiones.map(g=>[g.fecha_gestion,g.pagare,g.nombre_deudor,g.canal,g.resultado,g.fecha_compromiso,g.monto_comprometido,g.observaciones,g.gestor])], 'gestiones.csv')
      }
    },
    {
      icon: '🔔',
      title: 'Sin Gestión Reciente (+7 días)',
      desc: 'Mora activa sin gestión en la última semana',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','CATEGORIAF','SALDOCAPIT','DIASMORA','SALDOPONER']
        const d = cartera.filter(r=>r.diasmora>0).filter(r=>{
          const ult = gestiones.filter(g=>g.pagare===r.pagare).sort((a,b)=>new Date(b.fecha_gestion)-new Date(a.fecha_gestion))[0]
          return !ult||(new Date()-new Date(ult.fecha_gestion))/864e5>7
        })
        dlCSV([h, ...d.map(r=>h.map(k=>r[k.toLowerCase()]??''))], 'pendiente.csv')
      }
    },
  ]

  return (
    <div className="page-enter space-y-3">
      {reports.map((r, i) => (
        <div key={i} className="bg-white border border-surface-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-4">
            <span className="text-2xl">{r.icon}</span>
            <div>
              <p className="font-display font-semibold text-slate-700">{r.title}</p>
              <p className="font-mono text-xs text-slate-400 mt-0.5">{r.desc}</p>
            </div>
          </div>
          <button onClick={r.action} className="btn-primary btn-sm">Descargar CSV</button>
        </div>
      ))}
    </div>
  )
}
