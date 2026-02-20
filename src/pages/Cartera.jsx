import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { cop, moraDays, fmtDate } from '../lib/utils'
import DataTable from '../components/DataTable'

export default function Cartera({ onNav }) {
  const { cartera } = useApp()
  const [search, setSearch] = useState('')
  const [fCat, setFCat]     = useState('')
  const [fPago, setFPago]   = useState('')
  const [fPer, setFPer]     = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return cartera.filter(r => {
      if (q && !r.nombre?.toLowerCase().includes(q) && !r.pagare?.includes(q) && !r.cedulasoci?.includes(q)) return false
      if (fCat  && r.categoriaf !== fCat)  return false
      if (fPago && r.formapago  !== fPago) return false
      if (fPer  && r.periodocap !== fPer)  return false
      return true
    })
  }, [cartera, search, fCat, fPago, fPer])

  const columns = [
    { key: 'pagare',    label: 'Pagaré',       render: r => <span className="font-mono text-xs">{r.pagare}</span> },
    { key: 'nombre',    label: 'Nombre',        render: r => <span className="font-medium">{r.nombre}</span> },
    { key: 'cedulasoci',label: 'Cédula',        render: r => <span className="font-mono text-xs">{r.cedulasoci}</span> },
    { key: 'saldocapit',label: 'Saldo Capital', right: true, render: r => <span className="font-mono text-xs font-medium">{cop(r.saldocapit)}</span> },
    { key: 'diasmora',  label: 'Mora',          render: r => {
        const m = moraDays(r.diasmora)
        return <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-xs ${m.cls}`}>{m.label}</span>
      }
    },
    { key: 'categoriaf',label: 'Cat',           render: r => {
        const cls = { A:'bg-emerald-50 text-emerald-700', B:'bg-amber-50 text-amber-700', C:'bg-orange-50 text-orange-600', D:'bg-red-50 text-red-600', E:'bg-red-100 text-red-700' }
        return <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono text-xs font-bold ${cls[r.categoriaf]||''}`}>{r.categoriaf}</span>
      }
    },
    { key: 'formapago', label: 'Forma Pago',    render: r => (
        <span className={`inline-flex px-2 py-0.5 rounded font-mono text-xs ${r.formapago==='T' ? 'bg-blue-50 text-blue-600' : 'bg-cyan-50 text-cyan-600'}`}>
          {r.formapago==='T' ? 'Taquilla' : r.formapago==='N' ? 'Nómina' : r.formapago}
        </span>
      )
    },
    { key: 'tasacoloca',label: 'Tasa',          render: r => <span className="font-mono text-xs">{r.tasacoloca ? r.tasacoloca+'%' : '—'}</span> },
    { key: 'accion',    label: '',              render: r => (
        <button onClick={() => onNav('gestion', r)} className="btn-outline btn-sm">Gestionar</button>
      )
    },
  ]

  const select = 'bg-white border border-surface-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-400 cursor-pointer'

  return (
    <div className="page-enter">
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
            {['A','B','C','D','E'].map(c => <option key={c} value={c}>Cat. {c}</option>)}
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
          <span className="ml-auto font-mono text-xs text-slate-400">{filtered.length} registros</span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyIcon="📋"
          emptyText="Carga el plano para ver los créditos"
        />
      </div>
    </div>
  )
}
