import { useState } from 'react'

const PAGE_SIZE = 20

export default function DataTable({ columns, data, emptyIcon = '📋', emptyText = 'Sin datos' }) {
  const [page, setPage] = useState(1)
  const total = data.length
  const pages = Math.ceil(total / PAGE_SIZE)
  const slice = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (!total) return (
    <div className="text-center py-16 text-slate-300">
      <div className="text-5xl opacity-30 mb-3">{emptyIcon}</div>
      <p className="text-sm text-slate-400">{emptyText}</p>
    </div>
  )

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.right ? 'text-right' : ''}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} className={col.right ? 'text-right' : ''}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 bg-surface-50">
          <p className="font-mono text-xs text-slate-400">{total} registros</p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-surface-200 bg-white text-slate-500 text-xs disabled:opacity-30 hover:border-brand-300 hover:text-brand-500 transition-colors"
            >‹</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg border text-xs font-mono transition-colors
                  ${p === page ? 'bg-brand-500 border-brand-500 text-white' : 'border-surface-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-500'}`}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="w-8 h-8 rounded-lg border border-surface-200 bg-white text-slate-500 text-xs disabled:opacity-30 hover:border-brand-300 hover:text-brand-500 transition-colors"
            >›</button>
          </div>
        </div>
      )}
    </div>
  )
}
