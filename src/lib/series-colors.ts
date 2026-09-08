// Only the first two are validated for colorblind-safe contrast against each
// other (see dataviz palette checks) — this app's experiments are almost
// always A/B, so that's the common case. A third+ variant still gets a
// distinct hue, just without that guarantee, and every consumer of these
// pairs a color with a text label so identity never rests on hue alone.
const SERIES_COLOR_VARS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const;

export function seriesColor(index: number): string {
  return `hsl(var(--${SERIES_COLOR_VARS[index % SERIES_COLOR_VARS.length]}))`;
}
