// Seeded random numbers, so a screenshot state can be replayed exactly.
// A small mulberry32 generator: deterministic for a given seed, good
// enough for guard jitter and for the decorative fireflies on the title.

export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick an integer in [min, max] from a generator made by makeRandom.
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Shuffle a copy of an array with a seeded generator.
export function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
