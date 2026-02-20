import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { cop, moraDays, fmtDate, dlCSV } from '../lib/utils'
import DataTable from '../components/DataTable'
import KPI from '../components/KPI'

export default function Cartera({ onNav }) {
  const { cartera, stats, toggleGestionado } = useApp()
  // make sure stats is an object before unpacking
  const {
    totalCap = 0,
    enMora = [],
    saldoMora = 0,
    pctMora = '0.00',
    saldoPoner = 0,
    avgDiasMora = '0.0',
    avgSaldo = 0,
    catData = [],
  } = stats || {}
  // debug logs
  React.useEffect(() => {
    console.log('Cartera render', { length: cartera.length, stats })
  }, [cartera, stats])
  const [search, setSearch] = useState('')
  const [fCat, setFCat] = useState('')
  const [fPago, setFPago] = useState('')
  const [fPer, setFPer] = useState('')
  const [fGest, setFGest] = useState('')
  const [onlyVencidos, setOnlyVencidos] = useState(false)

  // ---- summaries / metrics -------------------------------------------------
  // stats already destructured above with defaults
  const catBarColor = { A: 'bg-emerald-400', B: 'bg-amber-400', C: 'bg-orange-400', D: 'bg-red-400', E: 'bg-red-600' }
  const catTextColor = { A: 'text-emerald-700', B: 'text-amber-700', C: 'text-orange-700', D: 'text-red-600', E: 'text-red-700' }

  // --------------------------------------------------------------------------

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return cartera.filter(r => {
      if (onlyVencidos && !(r.diasmora > 0)) return false
      if (q && !r.nombre?.toLowerCase().includes(q) && !r.pagare?.includes(q) && !r.cedulasoci?.includes(q)) return false
      if (fCat && r.categoriaf !== fCat) return false
      if (fPago && r.formapago !== fPago) return false
      if (fPer && r.periodocap !== fPer) return false
      if (fGest === 'si' && !r.gestionado) return false
      if (fGest === 'no' && r.gestionado) return false
      return true
    })
  }, [cartera, search, fCat, fPago, fPer, fGest, onlyVencidos])

  const columns = [
    { key: 'pagare', label: 'Pagaré', render: r => <span className="font-mono text-xs">{r.pagare}</span>, sortable: true },
    {
      key: 'nombre', label: 'Nombre', render: r => (
        <span className="flex items-center gap-1.5">
          <button
            title={r.gestionado ? 'Marcar como no gestionado' : 'Marcar como gestionado'}
            onClick={e => { e.stopPropagation(); toggleGestionado(r.pagare, !r.gestionado) }}
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${r.gestionado
              ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600'
              : 'bg-white border-slate-300 text-transparent hover:border-emerald-400'
              }`}
          >
            <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="font-medium">{r.nombre}</span>
        </span>
      ), sortable: true
    },
    { key: 'cedulasoci', label: 'Cédula', render: r => <span className="font-mono text-xs">{r.cedulasoci}</span>, sortable: true },
    { key: 'saldocapit', label: 'Saldo Capital', right: true, render: r => <span className="font-mono text-xs font-medium">{cop(r.saldocapit)}</span>, sortable: true, sortValue: r => r.saldocapit || 0 },
    {
      key: 'diasmora', label: 'Mora', render: r => {
        const m = moraDays(r.diasmora)
        return <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-xs ${m.cls}`}>{m.label}</span>
      }, sortable: true, sortValue: r => r.diasmora || 0
    },
    {
      key: 'categoriaf', label: 'Cat', render: r => {
        const cls = { A: 'bg-emerald-50 text-emerald-700', B: 'bg-amber-50 text-amber-700', C: 'bg-orange-50 text-orange-600', D: 'bg-red-50 text-red-600', E: 'bg-red-100 text-red-700' }
        return <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-xs font-bold ${cls[r.categoriaf] || ''}`}>{r.categoriaf}</span>
      }, sortable: true,
    },
    {
      key: 'formapago', label: 'Forma Pago', render: r => (
        <span className={`inline-flex px-2 py-0.5 rounded font-mono text-xs ${r.formapago === 'T' ? 'bg-blue-50 text-blue-600' : 'bg-cyan-50 text-cyan-600'}`}>
          {r.formapago === 'T' ? 'Taquilla' : r.formapago === 'N' ? 'Nómina' : r.formapago}
        </span>
      ), sortable: true,
    },
    { key: 'tasacoloca', label: 'Tasa', render: r => <span className="font-mono text-xs">{r.tasacoloca ? r.tasacoloca + '%' : '—'}</span>, sortable: true, sortValue: r => r.tasacoloca || 0 },
    {
      key: 'accion', label: '', render: r => (
        <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm">Gestionar</button>
      ), sortable: false
    },
  ]

  const select = 'bg-white border border-surface-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-400 cursor-pointer'
  const inputCls = 'w-full bg-surface-50 border border-surface-200 text-slate-800 placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10'

  return (
    <div className="page-enter space-y-6">

      {/* summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI label="Cartera total" value={cop(totalCap)} sub={`${cartera.length} créditos`} accent="blue" />
        <KPI label="Saldo en mora" value={cop(saldoMora)} sub={`${pctMora}% del total`} accent="red" />
        <KPI label="Por ponerse al día" value={cop(saldoPoner)} accent="amber" />
        <KPI label="Créditos vencidos" value={enMora.length} accent="cyan" />
        <KPI label="Promedio mora" value={`${avgDiasMora} d`} accent="green" />
        <KPI label="Saldo promedio" value={cop(avgSaldo)} accent="blue" />
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 bg-surface-50 flex-wrap">
          <input
            type="text"
            placeholder="🔍 Buscar nombre, pagaré, cédula..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base w-64"
          />
          <select value={fCat} onChange={e => setFCat(e.target.value)} className={select}>
            <option value="">Todas las categorías</option>
            {['A', 'B', 'C', 'D', 'E'].map(c => <option key={c} value={c}>Cat. {c}</option>)}
          </select>
          <select value={fPago} onChange={e => setFPago(e.target.value)} className={select}>
            <option value="">Forma de pago</option>
            <option value="T">Taquilla</option>
            <option value="N">Nómina</option>
          </select>
          <select value={fPer} onChange={e => setFPer(e.target.value)} className={select}>
            <option value="">Período</option>
            <option value="M">Mensual</option>
            <option value="Q">Quincenal</option>
          </select>
          <select value={fGest} onChange={e => setFGest(e.target.value)} className={select}>
            <option value="">Todos (gestión)</option>
            <option value="si">✅ Gestionados</option>
            <option value="no">⭕ Sin gestionar</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-1" checked={onlyVencidos} onChange={e => setOnlyVencidos(e.target.checked)} />
              Sólo vencidos
            </label>
            <button
              className="btn-outline btn-sm"
              onClick={() => {
                const headers = ['PAGARE', 'NOMBRE', 'CEDULASOCI', 'CATEGORIAF', 'SALDOCAPIT', 'DIASMORA', 'FORMAPAGO', 'PERIODOCAP']
                dlCSV([headers, ...filtered.map(r => headers.map(h => r[h.toLowerCase()] ?? ''))], 'cartera_filtrada.csv')
              }}
            >Exportar CSV</button>
            <span className="ml-auto font-mono text-xs text-slate-400">{filtered.length} registros</span>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyIcon="📋"
          emptyText="Carga el plano para ver los créditos"
          initialSort={{ key: 'diasmora', direction: 'desc' }}
        />
      </div>

      {/* category distribution bars */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-4">Distribución por categoría (saldo capital)</p>
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
    </div>
  )
}
