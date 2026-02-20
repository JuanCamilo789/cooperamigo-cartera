import { useState } from 'react'
import { sb } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = async () => {
    setError(''); setLoading(true)
    const { error: err } = await sb.auth.signInWithPassword({ email, password: pass })
    setLoading(false)
    if (err) setError('Credenciales incorrectas. Intenta de nuevo.')
    else onLogin()
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-brand-50 to-transparent rounded-full opacity-60" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Header above card */}
        <div className="text-center mb-8">
          <span className="font-mono text-xs tracking-[4px] text-brand-500 uppercase">Cooperamigó</span>
          <h1 className="font-display font-bold text-3xl text-slate-800 mt-2 tracking-tight">Gestión de Cartera</h1>
          <p className="text-slate-400 text-sm mt-1">Ingresa con tu cuenta autorizada</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Correo</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="correo@cooperamigo.com"
                className="input-base"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="••••••••"
                className="input-base"
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              onClick={doLogin}
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading
                ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Ingresar'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6 font-mono">© Cooperamigó · Sistema de Cartera</p>
      </div>
    </div>
  )
}
