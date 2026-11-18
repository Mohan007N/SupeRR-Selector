// CSV export helpers. Columns look like: { header: 'Player', value: (row) => row.name }

function escapeCell(value) {
  if (value === null || value === undefined) {
    return ''
  }
  let text = String(value)
  // Stop spreadsheet apps from running text that starts like a formula.
  if (typeof value === 'string' && /^[=+\-@]/.test(text)) {
    text = "'" + text
  }
  if (/[",\n\r]/.test(text)) {
    text = '"' + text.replace(/"/g, '""') + '"'
  }
  return text
}

export function buildCsv(columns, rows) {
  const lines = []
  const headerCells = []
  for (let c = 0; c < columns.length; c++) {
    headerCells.push(escapeCell(columns[c].header))
  }
  lines.push(headerCells.join(','))

  for (let r = 0; r < rows.length; r++) {
    const cells = []
    for (let c = 0; c < columns.length; c++) {
      cells.push(escapeCell(columns[c].value(rows[r], r)))
    }
    lines.push(cells.join(','))
  }
  return lines.join('\r\n')
}

export function downloadCsv(filename, columns, rows, preamble = []) {
  const commentLines = []
  for (let i = 0; i < preamble.length; i++) {
    commentLines.push(escapeCell('# ' + preamble[i]))
  }
  const body = buildCsv(columns, rows)
  const text = (commentLines.length > 0 ? commentLines.join('\r\n') + '\r\n' : '') + body

  // The BOM makes Excel read the file as UTF-8.
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(function revoke() {
    URL.revokeObjectURL(url)
  }, 1000)
  return rows.length
}
