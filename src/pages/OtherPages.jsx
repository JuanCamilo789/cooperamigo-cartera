import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { cop, fmtDate, calcCat, dlCSV, diaDeFecha } from '../lib/utils'
import DataTable from '../components/DataTable'

// ───── ALERTAS ─────
export function Alertas() {
  const { cartera, gestiones } = useApp()
  const hoy = new Date()

  const alerts = []

  const de = cartera.filter(r => ['D','E'].includes(r.categoriaf))
  if (de.length) alerts.push({
    type: 'crit',
    title: `${de.length} créditos en categoría D o E`,
    detail: `Saldo en riesgo: ${cop(de.reduce((s,r) => s+(r.saldocapit||0), 0))}`,
  })

  const sinGest = cartera.filter(r => (r.diasmora||0) > 0).filter(r => {
    const ult = gestiones
      .filter(g => g.pagare === r.pagare)
      .sort((a,b) => new Date(b.fecha_gestion) - new Date(a.fecha_gestion))[0]
    return !ult || (hoy - new Date(ult.fecha_gestion)) / 864e5 > 7
  })
  if (sinGest.length) alerts.push({
    type: 'warn',
    title: `${sinGest.length} créditos sin gestión en más de 7 días`,
    detail: `${cop(sinGest.reduce((s,r) => s+(r.saldocapit||0),0))} en mora sin contacto reciente`,
  })

  const finMes   = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0)
  const diasRest = Math.ceil((finMes - hoy) / 864e5)
  const rod = cartera.filter(r => (r.diasmora||0) > 0 && calcCat((r.diasmora||0) + diasRest) !== r.categoriaf)
  if (rod.length) alerts.push({
    type: 'info',
    title: `${rod.length} créditos rodarán de categoría al cierre del mes`,
    detail: `Quedan ${diasRest} días para el cierre`,
  })

  const borderMap = { crit:'border-l-red-400', warn:'border-l-amber-400', info:'border-l-brand-400' }
  const dotMap    = { crit:'bg-red-400',        warn:'bg-amber-400',       info:'bg-brand-400' }

  return (
    <div className="page-enter space-y-3">
      {!alerts.length && (
        <div className="text-center py-20">
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
// raportes = día del mes en que vence el pago recurrente de cada crédito
export function CobrosHoy({ onNav }) {
  const { cartera } = useApp()
  const diaHoy = new Date().getDate()

  const [search, setSearch] = useState('')
  const [formaPago, setFormaPago] = useState('')
  const [periodo, setPeriodo] = useState('')

  const cobros = useMemo(() => {
    const base = cartera.filter(r => {
      // interpretar raportes si es día numérico válido
      const rp = diaDeFecha(r.raportes)
      if (rp !== null) {
        return rp === diaHoy
      }
      // fallback a fecha de desembolso / vencimiento
      const fd = diaDeFecha(r.fechadesem)
      if (fd !== null) {
        return fd === diaHoy
      }
      return false
    }).sort((a,b) => b.anualidad - a.anualidad)

    return base.filter(r => {
      if (search) {
        const s = search.toLowerCase()
        if (!((r.pagare||'').toLowerCase().includes(s) || (r.nombre||'').toLowerCase().includes(s))) {
          return false
        }
      }
      if (formaPago && r.formapago !== formaPago) return false
      if (periodo && r.periodocap !== periodo) return false
      return true
    })
  }, [cartera, diaHoy, search, formaPago, periodo])

  const totalEsperado = cobros.reduce((s,r) => s+(r.anualidad||0), 0)

  if (!cobros.length) return (
    <div className="page-enter text-center py-20">
      <div className="text-5xl opacity-20 mb-3">📅</div>
      <p className="text-slate-600 font-medium">No hay cobros para el día {diaHoy} del mes</p>
      <p className="font-mono text-xs text-slate-400 mt-2">Los cobros se filtran por el campo RAPORTES (día del mes)</p>
    </div>
  )

  return (
    <div className="page-enter space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por pagaré o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select value={formaPago} onChange={e => setFormaPago(e.target.value)} className="input-field">
          <option value="">Forma de Pago</option>
          <option value="T">Taquilla</option>
          <option value="N">Nómina</option>
        </select>
        <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="input-field">
          <option value="">Período</option>
          <option value="M">Mensual</option>
          <option value="Q">Quincenal</option>
        </select>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-3">
        <p className="font-mono text-xs text-brand-600">
          <span className="font-bold text-base text-brand-700">{cobros.length}</span> cobros hoy (día {diaHoy}) ·{' '}
          <span className="font-bold">{cop(totalEsperado)}</span> esperado
        </p>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Pagaré</th>
              <th>Deudor</th>
              <th>Forma Pago</th>
              <th>Período</th>
              <th>F. Desem.</th>
              <th className="text-right">Cuota</th>
              <th className="text-right">Mora</th>
              <th className="text-right">Saldo Poner</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cobros.map((r, i) => {
              const catCls = { A:'bg-emerald-50 text-emerald-700', B:'bg-amber-50 text-amber-700', C:'bg-orange-50 text-orange-600', D:'bg-red-50 text-red-600', E:'bg-red-100 text-red-700' }
              return (
                <tr key={i}>
                  <td className="font-mono text-xs font-semibold">{r.pagare}</td>
                  <td>
                    <div className="font-medium text-sm">{r.nombre}</div>
                    <div className="font-mono text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      {r.cedulasoci}
                      <button
                        onClick={() => navigator.clipboard.writeText(r.cedulasoci || '')}
                        title="Copiar cédula"
                        className="text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded font-mono text-xs ${r.formapago==='T' ? 'bg-blue-50 text-blue-600' : 'bg-cyan-50 text-cyan-600'}`}>
                      {r.formapago==='T' ? 'Taquilla' : r.formapago==='N' ? 'Nómina' : r.formapago||'—'}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{r.periodocap==='M' ? 'Mensual' : r.periodocap==='Q' ? 'Quincenal' : r.periodocap||'—'}</td>
                  <td className="font-mono text-xs">{r.fechadesem || '—'}</td>
                  <td className="text-right font-mono text-sm font-bold text-brand-600">{cop(r.anualidad)}</td>
                  <td>
                    <div className="text-right font-mono text-xs">
                      {r.cuotasmora||0} cuota{((r.cuotasmora||0) === 1 ? '' : 's')}
                    </div>
                    <div className="text-right">
                      {(r.diasmora||0) > 0
                        ? <span className="inline-flex px-2 py-0.5 rounded-full font-mono text-xs bg-red-50 text-red-600">{r.diasmora}d</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full font-mono text-xs bg-emerald-50 text-emerald-600">Al día</span>
                      }
                    </div>
                  </td>
                  <td className="text-right font-mono text-xs">{cop(r.saldoponer)}</td>
                  <td>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-xs font-bold ${catCls[r.categoriaf]||''}`}>
                      {r.categoriaf}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm">Gestionar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ───── VENCIDOS ─────
export function Vencidos({ onNav }) {
  const { cartera } = useApp()
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')

  const vencidos = useMemo(() => {
    const base = [...cartera]
      .filter(r => (r.diasmora||0) > 0)
      .sort((a,b) => (b.diasmora||0) - (a.diasmora||0))

    return base.filter(r => {
      if (search) {
        const s = search.toLowerCase()
        if (!((r.pagare||'').toLowerCase().includes(s) || (r.nombre||'').toLowerCase().includes(s) || (r.cedulasoci||'').toLowerCase().includes(s))) {
          return false
        }
      }
      if (categoria && r.categoriaf !== categoria) return false
      return true
    })
  }, [cartera, search, categoria])

  const catCls = { A:'bg-emerald-50 text-emerald-700', B:'bg-amber-50 text-amber-700', C:'bg-orange-50 text-orange-600', D:'bg-red-50 text-red-600', E:'bg-red-100 text-red-700' }

  const columns = [
    { key:'pagare',    label:'Pagaré',        render: r => <span className="font-mono text-xs">{r.pagare}</span> },
    { key:'nombre',    label:'Nombre',         render: r => <span className="font-medium">{r.nombre}</span> },
    { key:'cedulasoci',label:'Cédula',         render: r => <span className="font-mono text-xs">{r.cedulasoci}</span> },
    { key:'saldocapit',label:'Saldo Capital',  right: true, render: r => <span className="font-mono text-xs font-semibold">{cop(r.saldocapit)}</span> },
    { key:'saldoponer',label:'x Ponerse al Día', right: true, render: r => <span className="font-mono text-xs text-amber-600">{cop(r.saldoponer)}</span> },
    { key:'cuotasmora',label:'Cuotas Mora',    render: r => <span className="font-mono text-xs">{r.cuotasmora||0}</span> },
    { key:'diasmora',  label:'Días Vencido',   render: r => (
        <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-xs
          ${(r.diasmora||0)>180 ? 'bg-red-100 text-red-700'
          : (r.diasmora||0)>90  ? 'bg-red-50 text-red-600'
          : (r.diasmora||0)>60  ? 'bg-orange-50 text-orange-600'
          : 'bg-amber-50 text-amber-700'}`}>
          {r.diasmora}d
        </span>
      )
    },
    { key:'categoriaf',label:'Cat', render: r => (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-xs font-bold ${catCls[r.categoriaf]||''}`}>
          {r.categoriaf}
        </span>
      )
    },
    { key:'accion', label:'', render: r => (
        <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm">Gestionar</button>
      )
    },
  ]

  return (
    <div className="page-enter space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por pagaré, nombre o cédula..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="input-field">
          <option value="">Todas las Categorías</option>
          <option value="A">A (Al día)</option>
          <option value="B">B (1-30 días)</option>
          <option value="C">C (31-60 días)</option>
          <option value="D">D (61-90 días)</option>
          <option value="E">E (+91 días)</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <DataTable columns={columns} data={vencidos} emptyIcon="✅" emptyText="No hay créditos vencidos" />
      </div>
    </div>
  )
}

// ───── RODAMIENTO ─────
// Lógica: al crédito en mora se le suman los días que faltan para el fin de mes.
// Si con esa proyección cambia de categoría → está en rodamiento.
export function Rodamiento({ onNav }) {
  const { cartera } = useApp()
  const [search, setSearch] = useState('')
  const [transicion, setTransicion] = useState('')

  const hoy    = new Date()
  // Último día del mes actual
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0)
  // Días corridos que faltan (incluyendo hoy)
  const diasRest = Math.ceil((finMes - hoy) / 864e5)

  const rod = useMemo(() => {
    const base = cartera
      .filter(r => (r.diasmora||0) > 0)
      .map(r => ({
        ...r,
        diasFin: (r.diasmora||0) + diasRest,
        catFin:  calcCat((r.diasmora||0) + diasRest),
      }))
      .filter(r => r.catFin !== r.categoriaf)
      .sort((a,b) => b.saldocapit - a.saldocapit)

    return base.filter(r => {
      if (search) {
        const s = search.toLowerCase()
        if (!((r.pagare||'').toLowerCase().includes(s) || (r.nombre||'').toLowerCase().includes(s))) {
          return false
        }
      }
      if (transicion) {
        const [from, to] = transicion.split('→')
        if (r.categoriaf !== from || r.catFin !== to) return false
      }
      return true
    })
  }, [cartera, diasRest, search, transicion])

  // Resumen de transiciones
  const transiciones = ['A→B','B→C','C→D','D→E'].map(t => {
    const [from, to] = t.split('→')
    const items = rod.filter(r => r.categoriaf === from && r.catFin === to)
    return {
      label: t,
      from,
      to,
      count: items.length,
      saldo: items.reduce((s,r) => s+(r.saldocapit||0), 0),
    }
  })

  const catCls = { A:'bg-emerald-50 text-emerald-700', B:'bg-amber-50 text-amber-700', C:'bg-orange-50 text-orange-600', D:'bg-red-50 text-red-600', E:'bg-red-100 text-red-700' }
  const transBorder = { 'A→B':'border-amber-200', 'B→C':'border-orange-200', 'C→D':'border-red-300', 'D→E':'border-red-400' }
  const transText   = { 'A→B':'text-amber-600',   'B→C':'text-orange-600',   'C→D':'text-red-600',   'D→E':'text-red-700' }

  const columns = [
    { key:'pagare',    label:'Pagaré',      render: r => <span className="font-mono text-xs">{r.pagare}</span> },
    { key:'nombre',    label:'Nombre',       render: r => <span className="font-medium">{r.nombre}</span> },
    { key:'saldocapit',label:'Saldo',        right: true, render: r => <span className="font-mono text-xs font-semibold">{cop(r.saldocapit)}</span> },
    { key:'diasmora',  label:'Mora Hoy',    render: r => <span className="font-mono text-xs">{r.diasmora}d</span> },
    { key:'diasFin',   label:`Mora al ${finMes.getDate()}/${finMes.getMonth()+1}`, render: r => <span className="font-mono text-xs text-red-500 font-semibold">{r.diasFin}d</span> },
    { key:'categoriaf',label:'Cat Hoy',     render: r => (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-xs font-bold ${catCls[r.categoriaf]||''}`}>
          {r.categoriaf}
        </span>
      )
    },
    { key:'catFin',    label:'Cat Cierre',  render: r => (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-xs font-bold ${catCls[r.catFin]||''}`}>
          {r.catFin}
        </span>
      )
    },
    { key:'accion', label:'', render: r => (
        <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm">Gestionar</button>
      )
    },
  ]

  return (
    <div className="page-enter space-y-5">

      {/* Info de días restantes */}
      <div className="bg-slate-50 border border-surface-200 rounded-xl px-5 py-3">
        <p className="font-mono text-xs text-slate-500">
          Hoy: <strong>{hoy.toLocaleDateString('es-CO')}</strong> ·
          Cierre del mes: <strong>{finMes.toLocaleDateString('es-CO')}</strong> ·
          Días restantes: <strong className="text-brand-600">{diasRest}</strong>
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por pagaré o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select value={transicion} onChange={e => setTransicion(e.target.value)} className="input-field">
          <option value="">Todas las Transiciones</option>
          <option value="A→B">A → B</option>
          <option value="B→C">B → C</option>
          <option value="C→D">C → D</option>
          <option value="D→E">D → E</option>
        </select>
      </div>

      {/* Resumen de transiciones */}
      <div className="grid grid-cols-4 gap-4">
        {transiciones.map(t => (
          <div key={t.label} className={`bg-white rounded-xl border ${transBorder[t.label]||'border-surface-200'} shadow-card p-5 text-center`}>
            <p className={`font-mono text-sm font-bold mb-1 ${transText[t.label]||'text-slate-500'}`}>{t.label}</p>
            <p className="font-display font-bold text-3xl text-slate-700">{t.count}</p>
            <p className="font-mono text-xs text-slate-400 mt-1">{cop(t.saldo)}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-300 mt-0.5">créditos</p>
          </div>
        ))}
      </div>

      {/* Tabla detalle */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-100 bg-surface-50">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {rod.length} créditos cambian de categoría al cierre del mes
          </p>
        </div>
        <DataTable
          columns={columns}
          data={rod}
          emptyIcon="🎉"
          emptyText="Ningún crédito cambia de categoría al cierre del mes"
        />
      </div>
    </div>
  )
}

// ───── REPORTES ─────
export function Reportes() {
  const { cartera, gestiones } = useApp()
  const hoy    = new Date()
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0)
  const diasRest = Math.ceil((finMes - hoy) / 864e5)

  const reports = [
    {
      icon:'📊', title:'Reporte General de Cartera', desc:'Todos los créditos del corte actual',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','CATEGORIAF','SALDOCAPIT','DIASMORA','SALDOPONER','ANUALIDAD','FORMAPAGO','PERIODOCAP','TASACOLOCA','FECHADESEM','PLAZO','RAPORTES']
        dlCSV([h, ...cartera.map(r => h.map(k => r[k.toLowerCase()]??''))], 'general.csv')
      }
    },
    {
      icon:'⚠️', title:'Cartera en Mora (B, C, D, E)', desc:'Solo créditos con categoría B o superior',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','CATEGORIAF','SALDOCAPIT','DIASMORA','SALDOPONER','CUOTASMORA']
        const d = cartera.filter(r => ['B','C','D','E'].includes(r.categoriaf))
        dlCSV([h, ...d.map(r => h.map(k => r[k.toLowerCase()]??''))], 'mora.csv')
      }
    },
    {
      icon:'🔴', title:'Cartera de Mayor Riesgo (C, D, E)', desc:'Créditos en categorías críticas',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','CATEGORIAF','SALDOCAPIT','DIASMORA','SALDOPONER']
        const d = cartera.filter(r => ['C','D','E'].includes(r.categoriaf))
        dlCSV([h, ...d.map(r => h.map(k => r[k.toLowerCase()]??''))], 'riesgo.csv')
      }
    },
    {
      icon:'📅', title:'Cobros del Día', desc:`Créditos con RAPORTES = día ${hoy.getDate()}`,
      action: () => {
        const diaHoy = hoy.getDate()
        const d = cartera.filter(r => {
          if (r.raportes !== null && r.raportes !== undefined) return Number(r.raportes) === diaHoy
          if (r.fechadesem) return parseInt(String(r.fechadesem).split("-")[2], 10) === diaHoy
          return false
        })
        const h = ['PAGARE','NOMBRE','CEDULASOCI','ANUALIDAD','SALDOPONER','DIASMORA','CATEGORIAF','NOMBREDEST','FORMAPAGO','RAPORTES']
        dlCSV([h, ...d.map(r => h.map(k => r[k.toLowerCase()]??''))], 'cobros_hoy.csv')
      }
    },
    {
      icon:'🔄', title:'Rodamiento del Mes', desc:'Créditos que cambiarán de categoría al cierre',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','SALDOCAPIT','DIASMORA','CATEGORIA_ACTUAL','DIAS_FIN_MES','CATEGORIA_FIN_MES']
        const d = cartera
          .filter(r => (r.diasmora||0) > 0)
          .map(r => ({ ...r, proy: (r.diasmora||0)+diasRest, catFin: calcCat((r.diasmora||0)+diasRest) }))
          .filter(r => r.catFin !== r.categoriaf)
        dlCSV([h, ...d.map(r => [r.pagare,r.nombre,r.cedulasoci,r.saldocapit,r.diasmora,r.categoriaf,r.proy,r.catFin])], 'rodamiento.csv')
      }
    },
    {
      icon:'✍️', title:'Gestiones Registradas', desc:'Historial completo de cobros',
      action: () => {
        const h = ['FECHA','PAGARE','NOMBRE','CANAL','RESULTADO','COMPROMISO','MONTO','OBSERVACIONES','GESTOR']
        dlCSV([h, ...gestiones.map(g => [g.fecha_gestion,g.pagare,g.nombre_deudor,g.canal,g.resultado,g.fecha_compromiso,g.monto_comprometido,g.observaciones,g.gestor])], 'gestiones.csv')
      }
    },
    {
      icon:'🔔', title:'Sin Gestión Reciente (+7 días)', desc:'Mora activa sin gestión en la última semana',
      action: () => {
        const h = ['PAGARE','NOMBRE','CEDULASOCI','CATEGORIAF','SALDOCAPIT','DIASMORA','SALDOPONER']
        const d = cartera.filter(r => (r.diasmora||0) > 0).filter(r => {
          const ult = gestiones.filter(g=>g.pagare===r.pagare).sort((a,b)=>new Date(b.fecha_gestion)-new Date(a.fecha_gestion))[0]
          return !ult || (new Date()-new Date(ult.fecha_gestion))/864e5 > 7
        })
        dlCSV([h, ...d.map(r => h.map(k => r[k.toLowerCase()]??''))], 'pendiente.csv')
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
