import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { today, fmtDate } from '../lib/utils'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'

export default function Gestiones({ prefill }) {
  const { gestiones, cartera, saveGestion } = useApp()
  const [search, setSearch]   = useState('')
  const [fRes, setFRes]       = useState('')
  const [open, setOpen]       = useState(!!prefill)
  const [form, setForm]       = useState({
    pagare: prefill?.pagare || '',
    nombre: prefill?.nombre || '',
    fecha:  today(),
    canal:  'Llamada telefónica',
    resultado: 'Sin respuesta',
    compromiso: '',
    monto: '',
    obs: '',
    gestor: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openModal = (r = null) => {
    setForm({
      pagare: r?.pagare || '',
      nombre: r?.nombre || '',
      fecha:  today(),
      canal:  'Llamada telefónica',
      resultado: 'Sin respuesta',
      compromiso: '',
      monto: '',
      obs: '',
      gestor: '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.pagare) return
    const c = cartera.find(r => r.pagare === form.pagare)
    const ok = await saveGestion({
      pagare: form.pagare,
      cedulasoci: c?.cedulasoci || null,
      nombre_deudor: form.nombre || c?.nombre || null,
      fecha_gestion: form.fecha,
      canal: form.canal,
      resultado: form.resultado,
      fecha_compromiso: form.compromiso || null,
      monto_comprometido: parseFloat(form.monto) || null,
      observaciones: form.obs || null,
      gestor: form.gestor || null,
    })
    if (ok) setOpen(false)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return gestiones.filter(g => {
      if (q && !g.pagare?.includes(q) && !g.nombre_deudor?.toLowerCase().includes(q)) return false
      if (fRes && g.resultado !== fRes) return false
      return true
    })
  }, [gestiones, search, fRes])

  const resBadge = {
    'Pago realizado':    'bg-emerald-50 text-emerald-700',
    'Pago comprometido': 'bg-blue-50 text-blue-600',
    'Acuerdo de pago':   'bg-cyan-50 text-cyan-600',
    'Sin respuesta':     'bg-slate-100 text-slate-500',
    'No localizado':     'bg-amber-50 text-amber-700',
    'Negativa de pago':  'bg-red-50 text-red-600',
    'Número equivocado': 'bg-orange-50 text-orange-600',
  }

  const columns = [
    { key: 'fecha_gestion',  label: 'Fecha',       render: g => <span className="font-mono text-xs">{fmtDate(g.fecha_gestion)}</span> },
    { key: 'pagare',         label: 'Pagaré',       render: g => <span className="font-mono text-xs">{g.pagare}</span> },
    { key: 'nombre_deudor',  label: 'Nombre',       render: g => <span className="font-medium">{g.nombre_deudor || '—'}</span> },
    { key: 'canal',          label: 'Canal',         render: g => <span className="text-sm text-slate-600">{g.canal}</span> },
    { key: 'resultado',      label: 'Resultado',    render: g => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-mono ${resBadge[g.resultado] || 'bg-slate-50 text-slate-500'}`}>{g.resultado}</span>
      )
    },
    { key: 'fecha_compromiso', label: 'Compromiso', render: g => <span className="font-mono text-xs">{fmtDate(g.fecha_compromiso)}</span> },
    { key: 'observaciones',  label: 'Observaciones', render: g => <span className="text-xs text-slate-500 max-w-xs truncate block">{g.observaciones || '—'}</span> },
    { key: 'gestor',         label: 'Gestor',        render: g => <span className="text-sm">{g.gestor || '—'}</span> },
  ]

  const inputCls = 'w-full bg-surface-50 border border-surface-200 text-slate-800 placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10'
  const labelCls = 'block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5'
  const select   = `${inputCls} cursor-pointer`

  return (
    <div className="page-enter">
      <div className="flex justify-end mb-4">
        <button onClick={() => openModal()} className="btn-primary">+ Nueva Gestión</button>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 bg-surface-50 flex-wrap">
          <input type="text" placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="input-base w-56" />
          <select value={fRes} onChange={e => setFRes(e.target.value)} className="bg-white border border-surface-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none cursor-pointer">
            <option value="">Todos los resultados</option>
            {Object.keys(resBadge).map(r => <option key={r}>{r}</option>)}
          </select>
          <span className="ml-auto font-mono text-xs text-slate-400">{filtered.length} gestiones</span>
        </div>
        <DataTable columns={columns} data={filtered} emptyIcon="✍️" emptyText="No hay gestiones registradas" />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar Gestión" sub="Nueva gestión de cobro">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Pagaré</label>
            <input className={inputCls} value={form.pagare} onChange={e => set('pagare', e.target.value)} placeholder="Número de pagaré" />
          </div>
          <div>
            <label className={labelCls}>Nombre deudor</label>
            <input className={inputCls} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <label className={labelCls}>Fecha de gestión</label>
            <input type="date" className={inputCls} value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Canal</label>
            <select className={select} value={form.canal} onChange={e => set('canal', e.target.value)}>
              {['Llamada telefónica','Visita domiciliaria','WhatsApp','Correo electrónico','Mensaje de texto','Carta','Presencial en oficina'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Resultado</label>
            <select className={select} value={form.resultado} onChange={e => set('resultado', e.target.value)}>
              {Object.keys(resBadge).map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Fecha compromiso</label>
            <input type="date" className={inputCls} value={form.compromiso} onChange={e => set('compromiso', e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>Monto comprometido</label>
          <input type="number" className={inputCls} value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="0" />
        </div>
        <div className="mt-4">
          <label className={labelCls}>Observaciones</label>
          <textarea className={inputCls + ' resize-y min-h-[72px]'} value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Notas de la gestión..." />
        </div>
        <div className="mt-4">
          <label className={labelCls}>Gestor</label>
          <input className={inputCls} value={form.gestor} onChange={e => set('gestor', e.target.value)} placeholder="Nombre del gestor" />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setOpen(false)} className="btn-outline">Cancelar</button>
          <button onClick={handleSave} className="btn-primary">Guardar gestión</button>
        </div>
      </Modal>
    </div>
  )
}
