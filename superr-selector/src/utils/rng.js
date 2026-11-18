// Small seeded random number generator so demo data is identical on every load.
export function createRng(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

export function randomBetween(rng, min, max) {
  return min + rng() * (max - min)
}

// Box-Muller transform.
export function randomNormal(rng, mean, standardDeviation) {
  let u = 0
  while (u === 0) {
    u = rng()
  }
  const v = rng()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + z * standardDeviation
}

export function pickOne(rng, list) {
  return list[Math.floor(rng() * list.length)]
}

export function pickWeighted(rng, options, weights) {
  let total = 0
  for (let i = 0; i < weights.length; i++) {
    total += weights[i]
  }
  let roll = rng() * total
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i]
    if (roll <= 0) {
      return options[i]
    }
  }
  return options[options.length - 1]
}
