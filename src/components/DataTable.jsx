export default function DataTable({ columns, data, emptyIcon = '📋', emptyText = 'Sin datos' }) {
  if (!data.length) return (
    <div className="text-center py-16">
      <div className="text-5xl opacity-20 mb-3">{emptyIcon}</div>
      <p className="text-sm text-slate-400">{emptyText}</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <div className="px-4 py-2 border-b border-surface-100 bg-surface-50 text-right">
        <span className="font-mono text-xs text-slate-400">{data.length} registros</span>
      </div>
      <table className="w-full border-collapse data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={col.right ? 'text-right' : ''}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
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
  )
}
