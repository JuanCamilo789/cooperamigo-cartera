import { sb } from '../lib/supabase'
import { useApp } from '../lib/AppContext'

const navItems = [
  { section: 'Principal' },
  { id: 'dashboard', icon: '▦',  label: 'Dashboard' },
  { id: 'cobros',    icon: '◷',  label: 'Cobros de Hoy' },
  { id: 'alertas',   icon: '⚑',  label: 'Alertas', badge: true },
  { section: 'Cartera' },
  { id: 'cartera',   icon: '☰',  label: 'Todos los Créditos' },
  { id: 'vencidos',  icon: '▲',  label: 'Créditos Vencidos' },
  { id: 'rodamiento',icon: '↻',  label: 'Rodamiento' },
  { section: 'Gestión' },
  { id: 'gestion',   icon: '✎',  label: 'Gestiones' },
  { id: 'reportes',  icon: '↓',  label: 'Reportes' },
]

export default function Sidebar({ active, onNav }) {
  const { cartera, gestiones, user } = useApp()

  const alertCount = cartera.filter(r => ['D','E'].includes(r.categoriaf)).length

  const doLogout = async () => {
    await sb.auth.signOut()
    window.location.reload()
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-surface-200 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-100">
        <p className="font-mono text-[9px] tracking-[3px] text-brand-500 uppercase mb-1">Cooperamigó</p>
        <h1 className="font-display font-800 text-xl text-slate-800 leading-tight">
          Cartera <span className="text-brand-500">Pro</span>
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navItems.map((item, i) => {
          if (item.section) return (
            <p key={i} className="font-mono text-[9px] tracking-[2.5px] uppercase text-slate-300 px-2 pt-4 pb-1.5 first:pt-1">
              {item.section}
            </p>
          )
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100 mb-0.5 text-left
                ${isActive
                  ? 'bg-brand-50 text-brand-600 border border-brand-100'
                  : 'text-slate-500 hover:bg-surface-50 hover:text-slate-700'}`}
            >
              <span className="text-base w-5 text-center opacity-70">{item.icon}</span>
              <span className="font-sans">{item.label}</span>
              {item.badge && alertCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-mono rounded-full px-1.5 py-px">
                  {alertCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 border-t border-surface-100">
        <div className="flex items-center gap-2.5 bg-surface-50 rounded-lg px-3 py-2.5 border border-surface-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-blue-400 flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate font-mono">{user?.email ?? '—'}</p>
          </div>
          <button onClick={doLogout} title="Cerrar sesión" className="text-slate-300 hover:text-red-400 transition-colors text-base">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}
