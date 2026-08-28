/**
 * Pure weight-allocation math for the Variants step's per-variant sliders.
 * Kept separate from the wizard component so the rounding/rebalancing
 * logic (the fiddly part) is unit-testable without React.
 */

/** Splits `total` (100 by default) evenly across `n` variants. Any
 * remainder from integer division goes to the first variants, one point
 * each, so the result always sums to exactly `total`
 * (e.g. equalSplit(3) => [34, 33, 33]). */
export function equalSplit(n: number, total = 100): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  return Array.from({ length: n }, (_, index) => base + (index < remainder ? 1 : 0));
}

/**
 * Typing an exact weight for one variant redistributes the delta across
 * ALL other variants proportionally to their current relative shares (or
 * an equal split, if every other variant is currently at 0 — proportional
 * redistribution has nothing to scale from in that case).
 *
 * Proportional shares are rounded via the largest-remainder method
 * (compute exact floating shares, floor them, then hand out the leftover
 * points one at a time to the largest fractional remainders) rather than
 * independently rounding each share — independent rounding can drift the
 * total a point or two off 100; this guarantees an exact match every time.
 */
export function rebalanceProportional(weights: number[], changedIndex: number, newWeight: number): number[] {
  const n = weights.length;
  if (n <= 1) return weights.map(() => 100);

  const clamped = Math.max(0, Math.min(100, Math.round(newWeight)));
  const remaining = 100 - clamped;
  const otherIndices = weights.map((_, index) => index).filter((index) => index !== changedIndex);
  const othersTotal = otherIndices.reduce((sum, index) => sum + weights[index], 0);

  const next = [...weights];
  next[changedIndex] = clamped;

  if (othersTotal === 0) {
    const shares = equalSplit(otherIndices.length, remaining);
    otherIndices.forEach((otherIndex, position) => {
      next[otherIndex] = shares[position];
    });
    return next;
  }

  const raw = otherIndices.map((index) => (weights[index] / othersTotal) * remaining);
  const floors = raw.map(Math.floor);
  const allocated = floors.reduce((total, floor) => total + floor, 0);
  const leftover = remaining - allocated;
  const byLargestRemainder = raw
    .map((share, position) => ({ position, frac: share - floors[position] }))
    .sort((first, second) => second.frac - first.frac);

  const shares = [...floors];
  for (let j = 0; j < leftover; j++) {
    shares[byLargestRemainder[j % byLargestRemainder.length].position] += 1;
  }
  otherIndices.forEach((otherIndex, position) => {
    next[otherIndex] = shares[position];
  });

  return next;
}
