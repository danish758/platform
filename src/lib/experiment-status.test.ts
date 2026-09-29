import { describe, expect, it } from 'vitest';
import { runLockErrors } from './experiment-status';

describe('runLockErrors', () => {
  it('blocks variants, targeting, and seed changes while running', () => {
    expect(runLockErrors('running', { variants: [], targeting: null, seed: 2 })).toEqual([
      "variants can't be changed while the experiment is running. Stop it first.",
      "targeting can't be changed while the experiment is running. Stop it first.",
      "seed can't be changed while the experiment is running. Stop it first.",
    ]);
  });

  it('allows other fields while running', () => {
    expect(runLockErrors('running', {})).toEqual([]);
  });

  it('allows everything when draft or stopped', () => {
    expect(runLockErrors('draft', { variants: [] })).toEqual([]);
    expect(runLockErrors('stopped', { targeting: [], seed: 1 })).toEqual([]);
  });
});
