export const cop = (n) => {
  if (!n) return '$0'
  return '$' + Math.round(n).toLocaleString('es-CO')
}

export const pct = (a, b) => {
  if (!b) return '0.00'
  return (a / b * 100).toFixed(2)
}

export const today = () => new Date().toISOString().split('T')[0]

export const fmtDate = (d) => {
  if (!d) return '—'
  const p = d.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d
}

export const calcCat = (dias) => {
  if (dias <= 0)   return 'A'
  if (dias <= 30)  return 'A'
  if (dias <= 60)  return 'B'
  if (dias <= 90)  return 'C'
  if (dias <= 180) return 'D'
  return 'E'
}

export const parseNum = (s) => {
  if (!s) return 0
  s = s.toString().trim().replace(/[$\s]/g, '')
  if (!s) return 0
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.')
  else if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.')
  return parseFloat(s) || 0
}

export const parseDate = (s) => {
  if (!s) return null
  s = s.toString().trim()
  if (/^\d{4,5}$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + parseInt(s) * 864e5)
    return d.toISOString().split('T')[0]
  }
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('/')
    return y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0')
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0')
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-')
    return y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0')
  }
  return s
}

export const catColor = {
  A: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  B: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  C: { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  D: { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200' },
  E: { bg: 'bg-red-100',    text: 'text-red-700',     border: 'border-red-300' },
}

export const moraDays = (dias) => {
  if (dias === 0)  return { label: 'Al día',  cls: 'bg-emerald-50 text-emerald-700' }
  if (dias <= 30)  return { label: `${dias}d`, cls: 'bg-amber-50 text-amber-700' }
  if (dias <= 60)  return { label: `${dias}d`, cls: 'bg-orange-50 text-orange-700' }
  if (dias <= 90)  return { label: `${dias}d`, cls: 'bg-red-50 text-red-600' }
  return                   { label: `${dias}d`, cls: 'bg-red-100 text-red-700' }
}

export const dlCSV = (rows, name) => {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  a.click()
}
export const diaDeFecha = (fechaStr) => {
  if (!fechaStr && fechaStr !== 0) return null
  const s = String(fechaStr).trim()
  // numeric day only (e.g. "20")
  if (/^\d{1,2}$/.test(s)) return parseInt(s, 10)
  if (s.includes('-')) {
    const parts = s.split('-')
    return parseInt(parts[parts.length - 1], 10)
  }
  if (s.includes('/')) {
    const parts = s.split('/')
    // assume d/m/y format
    return parseInt(parts[0], 10)
  }
  return null
}
