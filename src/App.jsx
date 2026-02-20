import { useState, useEffect } from 'react'
import { sb } from './lib/supabase'
import { AppProvider, useApp } from './lib/AppContext'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Cartera from './pages/Cartera'
import Gestiones from './pages/Gestiones'
import { Alertas, CobrosHoy, Vencidos, Rodamiento, Reportes } from './pages/OtherPages'

const PAGE_TITLES = {
  dashboard:  { pre: 'Panel de',    hi: 'Control' },
  cobros:     { pre: 'Cobros de',   hi: 'Hoy' },
  alertas:    { pre: '',            hi: 'Alertas Automáticas' },
  cartera:    { pre: 'Gestión de',  hi: 'Cartera' },
  vencidos:   { pre: 'Créditos',    hi: 'Vencidos' },
  rodamiento: { pre: '',            hi: 'Rodamiento de Cartera' },
  gestion:    { pre: 'Registro de', hi: 'Gestiones' },
  reportes:   { pre: '',            hi: 'Reportes' },
}

function AppShell() {
  const { loadData, processCSV } = useApp()
  const [page, setPage]           = useState('dashboard')
  const [prefill, setPrefill]     = useState(null)

  const goTo = (name, row = null) => { setPage(name); setPrefill(row || null) }

  useEffect(() => { loadData() }, [])

  const handleCSVFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => processCSV(ev.target.result)
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const title = PAGE_TITLES[page] || { pre: '', hi: page }

  const renderPage = () => {
    switch(page) {
      case 'dashboard':  return <Dashboard onNav={goTo} />
      case 'cobros':     return <CobrosHoy onNav={goTo} />
      case 'alertas':    return <Alertas />
      case 'cartera':    return <Cartera onNav={goTo} />
      case 'vencidos':   return <Vencidos onNav={goTo} />
      case 'rodamiento': return <Rodamiento onNav={goTo} />
      case 'gestion':    return <Gestiones prefill={prefill} />
      case 'reportes':   return <Reportes />
      default:           return null
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar active={page} onNav={goTo} />
      <main className="ml-60 min-h-screen">
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-200 px-8 py-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-slate-800 tracking-tight">
            {title.pre && <span className="text-slate-400 font-normal mr-1">{title.pre}</span>}
            <span className="text-brand-600">{title.hi}</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs text-emerald-600">En línea</span>
            </div>
            <label className="btn-primary cursor-pointer inline-flex items-center gap-1.5">
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVFile} />
              ⬆ Cargar CSV
            </label>
          </div>
        </div>
        <div className="px-8 py-7">{renderPage()}</div>
      </main>
      <Toast />
    </div>
  )
}

import ErrorBoundary from './components/ErrorBoundary'

function AppWithAuth() {
  const [authed, setAuthed]     = useState(false)
  const [checking, setChecking] = useState(true)
  const { setUser }             = useApp()

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session) { setAuthed(true); setUser(data.session.user) }
      setChecking(false)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session); setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (checking) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  if (!authed) return <Login onLogin={() => setAuthed(true)} />
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  )
}

export default function App() {
  return <AppProvider><AppWithAuth /></AppProvider>
}
