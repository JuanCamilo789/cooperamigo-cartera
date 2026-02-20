export default function Modal({ id, open, onClose, title, sub, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-modal border border-surface-200 w-[560px] max-h-[90vh] overflow-y-auto p-8 animate-[pageEnter_0.2s_ease_both]">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display font-700 text-xl text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors text-lg leading-none">✕</button>
        </div>
        {sub && <p className="font-mono text-xs text-slate-400 mb-6">{sub}</p>}
        {children}
      </div>
    </div>
  )
}
