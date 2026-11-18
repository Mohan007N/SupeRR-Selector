const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function isMissing(value) {
  return value === null || value === undefined || Number.isNaN(value)
}

export function formatNumber(value, digits = 0) {
  if (isMissing(value)) {
    return '—'
  }
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatPercent(value, digits = 1) {
  if (isMissing(value)) {
    return '—'
  }
  return formatNumber(value, digits) + '%'
}

export function formatSigned(value, digits = 1) {
  if (isMissing(value)) {
    return '—'
  }
  const text = formatNumber(Math.abs(value), digits)
  if (value > 0) {
    return '+' + text
  }
  if (value < 0) {
    return '-' + text
  }
  return text
}

// "2024-05-26" -> "26 May 2024". Parsed by hand so time zones never shift the day.
export function formatDate(isoDate) {
  if (!isoDate) {
    return '—'
  }
  const parts = isoDate.split('-')
  const monthIndex = Number(parts[1]) - 1
  return Number(parts[2]) + ' ' + MONTHS[monthIndex] + ' ' + parts[0]
}

export function formatShortDate(isoDate) {
  if (!isoDate) {
    return '—'
  }
  const parts = isoDate.split('-')
  const monthIndex = Number(parts[1]) - 1
  return Number(parts[2]) + ' ' + MONTHS[monthIndex] + " '" + parts[0].slice(2)
}

export function initials(name) {
  const words = name.split(' ')
  let result = ''
  for (let i = 0; i < words.length && result.length < 2; i++) {
    if (words[i].length > 0) {
      result += words[i][0].toUpperCase()
    }
  }
  return result
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
