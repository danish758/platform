import { describe, expect, it } from 'vitest';
import { equalSplit, rebalanceProportional } from './variant-weights';

describe('equalSplit', () => {
  it('splits evenly when it divides cleanly', () => {
    expect(equalSplit(2)).toEqual([50, 50]);
    expect(equalSplit(4)).toEqual([25, 25, 25, 25]);
  });

  it('gives the remainder to the first variants, one point each', () => {
    expect(equalSplit(3)).toEqual([34, 33, 33]);
    expect(sum(equalSplit(3))).toBe(100);
  });

  it('always sums to exactly 100 regardless of n', () => {
    for (let n = 1; n <= 11; n++) {
      expect(sum(equalSplit(n))).toBe(100);
    }
  });
});

describe('rebalanceProportional', () => {
  it('redistributes the delta proportionally to others\' current shares', () => {
    // control=50, a=30, b=20 -> control set to 70: the 20-point cut is
    // split 3:2 between a and b, matching their 30:20 ratio.
    const next = rebalanceProportional([50, 30, 20], 0, 70);
    expect(next[0]).toBe(70);
    expect(next[1]).toBe(18);
    expect(next[2]).toBe(12);
    expect(sum(next)).toBe(100);
  });

  it('falls back to an equal split when every other variant is at 0', () => {
    const next = rebalanceProportional([100, 0, 0], 0, 40);
    expect(next[0]).toBe(40);
    expect(next[1] + next[2]).toBe(60);
    expect(sum(next)).toBe(100);
  });

  it('clamps the typed value into [0, 100]', () => {
    expect(rebalanceProportional([50, 50], 0, 150)[0]).toBe(100);
    expect(rebalanceProportional([50, 50], 0, -20)[0]).toBe(0);
  });

  it('always sums to exactly 100, even with awkward ratios that would round unevenly', () => {
    const next = rebalanceProportional([33, 33, 34], 0, 10);
    expect(sum(next)).toBe(100);
  });

  it('setting the single other variant when there are only two always gives it the remainder', () => {
    const next = rebalanceProportional([50, 50], 0, 30);
    expect(next).toEqual([30, 70]);
  });
});

function sum(weights: number[]): number {
  return weights.reduce((a, b) => a + b, 0);
}
