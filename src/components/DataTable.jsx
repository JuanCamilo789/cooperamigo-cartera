import { useState, useMemo } from 'react'

export default function DataTable({ columns, data, emptyIcon = '📋', emptyText = 'Sin datos', initialSort = null }) {
  const [sortConfig, setSortConfig] = useState(initialSort)

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.key) return data
    const { key, direction } = sortConfig
    const col = columns.find(c => c.key === key)
    if (!col) return data
    const sorted = [...data].sort((a, b) => {
      let va = col.sortValue ? col.sortValue(a) : a[key]
      let vb = col.sortValue ? col.sortValue(b) : b[key]
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return direction === 'asc' ? -1 : 1
      if (va > vb) return direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [data, sortConfig, columns])

  const requestSort = key => {
    let direction = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  if (!data.length) return (
    <div className="text-center py-16">
      <div className="text-5xl opacity-20 mb-3">{emptyIcon}</div>
      <p className="text-sm text-slate-400">{emptyText}</p>
    </div>
  )

  return (
    <div className="overflow-x-auto relative">
      <div className="px-4 py-2 border-b border-surface-100 bg-surface-50 text-right">
        <span className="font-mono text-xs text-slate-400">{data.length} registros</span>
      </div>
      <table className="w-full border-collapse data-table">
        <thead className="bg-white">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`${col.right ? 'text-right' : ''} ${col.sortable === false ? '' : 'cursor-pointer select-none'} sticky top-0 bg-white z-10 px-2 py-2`}
                onClick={() => col.sortable === false ? null : requestSort(col.key)}
              >
                <div className="inline-flex items-center gap-1">
                  {col.label}
                  {sortConfig?.key === col.key && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-surface-50 hover:bg-surface-100">
              {columns.map(col => (
                <td key={col.key} className={`${col.right ? 'text-right' : ''} px-2 py-1`}> 
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
