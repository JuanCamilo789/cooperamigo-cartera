import { useApp } from '../lib/AppContext'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 right-6 z-[999] bg-white border rounded-xl shadow-modal px-5 py-3.5 text-sm font-sans transition-all duration-300
      ${toast.type === 'ok' ? 'border-l-4 border-l-emerald-400 border-surface-200' : 'border-l-4 border-l-red-400 border-surface-200'}`}>
      {toast.msg}
    </div>
  )
}
