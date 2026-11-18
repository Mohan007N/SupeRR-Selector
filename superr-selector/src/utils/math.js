export function clamp(value, min, max) {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

export function safeDivide(numerator, denominator, fallback = null) {
  if (!denominator) {
    return fallback
  }
  return numerator / denominator
}

export function mean(values) {
  if (values.length === 0) {
    return null
  }
  let total = 0
  for (let i = 0; i < values.length; i++) {
    total += values[i]
  }
  return total / values.length
}

// Population standard deviation.
export function standardDeviation(values) {
  if (values.length === 0) {
    return null
  }
  const average = mean(values)
  let squaredDiffs = 0
  for (let i = 0; i < values.length; i++) {
    const diff = values[i] - average
    squaredDiffs += diff * diff
  }
  return Math.sqrt(squaredDiffs / values.length)
}

// Share (0-100) of values that this value beats. Ties count as half.
export function percentileRank(values, value, higherIsBetter = true) {
  if (values.length === 0) {
    return 50
  }
  let beaten = 0
  for (let i = 0; i < values.length; i++) {
    const other = values[i]
    if (other === value) {
      beaten += 0.5
    } else if (higherIsBetter && other < value) {
      beaten += 1
    } else if (!higherIsBetter && other > value) {
      beaten += 1
    }
  }
  return (beaten / values.length) * 100
}
