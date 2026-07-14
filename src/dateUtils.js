export function parseSheetDate(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value

  const text = String(value).trim()
  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\D.*)?$/)
  if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  const local = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\D.*)?$/)
  if (!local) return null

  const first = Number(local[1])
  const second = Number(local[2])
  const year = Number(local[3])

  // Google Sheets puede mezclar celdas dd/MM/yyyy y M/d/yyyy.
  // Un valor mayor a 12 identifica la parte que representa el día.
  if (first > 12) return validDate(year, second, first)
  if (second > 12) return validDate(year, first, second)

  // Para fechas ambiguas, la exportación GViz del Sheet usa M/d/yyyy.
  return validDate(year, first, second)
}

function validDate(year, month, day) {
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export function toInputDate(value) {
  const date = parseSheetDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatShortDate(value) {
  const date = parseSheetDate(value)
  return date
    ? new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short' }).format(date).replace('.', '')
    : 'Sin fecha'
}
