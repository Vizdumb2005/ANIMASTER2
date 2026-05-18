function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function deterministicRandom(seed: number, namespace: string, tick = 0): number {
  let state = hashString(`${seed}:${namespace}:${tick}`) || 1;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return ((state >>> 0) % 1000000) / 1000000;
}

export function deterministicRange(seed: number, namespace: string, tick: number, min: number, max: number) {
  return min + deterministicRandom(seed, namespace, tick) * (max - min);
}

export function deterministicDirection(seed: number, namespace: string, tick = 0) {
  return deterministicRandom(seed, namespace, tick) >= 0.5 ? 1 : -1;
}

export function seedFromText(input: string): number {
  return hashString(input) || 1;
}
