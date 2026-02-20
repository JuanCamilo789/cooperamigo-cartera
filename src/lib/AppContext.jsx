import { createContext, useContext, useState, useCallback } from 'react'
import { sb } from '../lib/supabase'
import { parseNum, parseDate, calcCat, today } from '../lib/utils'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

export function AppProvider({ children }) {
  const [cartera, setCartera]       = useState([])
  const [gestiones, setGestiones]   = useState([])
  const [fechaCorte, setFechaCorte] = useState(null)
  const [user, setUser]             = useState(null)
  const [toast, setToast]           = useState(null)

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadData = useCallback(async () => {
    const { data: carr } = await sb.from('cartera').select('*').order('diasmora', { ascending: false })
    if (carr?.length) {
      setCartera(carr)
      setFechaCorte(carr[0].fecha_corte)
    }
    const { data: gest } = await sb.from('gestiones').select('*').order('created_at', { ascending: false })
    if (gest) setGestiones(gest)
  }, [])

  const processCSV = useCallback(async (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) { showToast('Archivo vacío', 'err'); return }

    const sep = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ','
    const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, '').toUpperCase())

    const colVariants = {
      pagare:     ['PAGARE'],
      cedulasoci: ['CEDULASOCI','CEDULA','CC'],
      nombre:     ['NOMBRE'],
      nombreempr: ['NOMBREEMPR','EMPRESA'],
      nombredest: ['NOMBREDEST','CORREO','EMAIL'],
      raportes:   ['RAPORTES'],
      anualidad:  ['ANUALIDAD','CUOTA'],
      fechadesem: ['FECHADESEM','FECHADESEMB'],
      saldocapit: ['SALDOCAPIT','SALDO'],
      plazo:      ['PLAZO'],
      tasacoloca: ['TASACOLOCA','TASA'],
      formapago:  ['FORMAPAGO'],
      periodocap: ['PERIODOCAP'],
      diasmora:   ['DIASMORA'],
      cuotasmora: ['CUOTASMORA'],
      saldoponer: ['SALDOPONER'],
      categoriaf: ['CATEGORIAF','CATEGORIA','CAT'],
    }

    const col = (name) => {
      for (const v of (colVariants[name] || [name])) {
        const i = headers.findIndex(h => h.includes(v) || v.includes(h))
        if (i !== -1) return i
      }
      return -1
    }

    const g = (row, name) => {
      const i = col(name)
      return i >= 0 ? (row[i] || '').toString().trim().replace(/^"|"$/g, '') : ''
    }

    const corteStr = today()
    const rows = lines.slice(1).map(line => {
      const row = line.split(sep)
      const diasmora = parseInt(g(row, 'diasmora')) || 0
      return {
        pagare:     g(row, 'pagare'),
        cedulasoci: g(row, 'cedulasoci'),
        nombre:     g(row, 'nombre'),
        nombreempr: g(row, 'nombreempr'),
        nombredest: g(row, 'nombredest'),
        raportes:   parseInt(g(row, 'raportes')) || null,
        anualidad:  parseNum(g(row, 'anualidad')),
        fechadesem: parseDate(g(row, 'fechadesem')),
        saldocapit: parseNum(g(row, 'saldocapit')),
        plazo:      parseInt(g(row, 'plazo')) || null,
        tasacoloca: parseNum(g(row, 'tasacoloca')),
        formapago:  g(row, 'formapago'),
        periodocap: g(row, 'periodocap'),
        diasmora,
        cuotasmora: parseInt(g(row, 'cuotasmora')) || 0,
        saldoponer: parseNum(g(row, 'saldoponer')),
        categoriaf: g(row, 'categoriaf') || calcCat(diasmora),
        fecha_corte: corteStr,
      }
    }).filter(r => r.pagare)

    const { error } = await sb.from('cartera').upsert(rows, { onConflict: 'pagare' })
    if (error) { showToast('Error al guardar: ' + error.message, 'err'); return }

    setCartera(rows)
    setFechaCorte(corteStr)
    showToast(`✓ ${rows.length} créditos cargados`, 'ok')
  }, [showToast])

  const saveGestion = useCallback(async (gestion) => {
    const { error } = await sb.from('gestiones').insert(gestion)
    if (error) { showToast('Error: ' + error.message, 'err'); return false }
    setGestiones(prev => [gestion, ...prev])
    showToast('✓ Gestión guardada', 'ok')
    return true
  }, [showToast])

  return (
    <AppCtx.Provider value={{ cartera, gestiones, fechaCorte, user, setUser, toast, showToast, loadData, processCSV, saveGestion }}>
      {children}
    </AppCtx.Provider>
  )
}
