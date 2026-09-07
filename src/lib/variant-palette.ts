// Categorical palette for distinguishing N experiment variants — indexed
// data, not a themeable/semantic token, so these stay plain hex constants
// rather than CSS variables. Colors are chosen to stay distinct from the
// app's blue accent (#2563eb) so a variant swatch is never mistaken for an
// interactive/accent element.
export const SEGMENT_COLORS = ['#94a3b8', '#059669', '#0891b2', '#d97706', '#e11d48', '#7c3aed'];

// Literal (not dynamically built) Tailwind arbitrary-variant classes, one
// set per palette color — Tailwind's JIT compiler only picks up class names
// it can see verbatim in source, so these can't be assembled from a
// template string at runtime.
export const THUMB_COLOR_CLASSES = [
  '[&::-webkit-slider-thumb]:bg-[#94a3b8] [&::-moz-range-thumb]:bg-[#94a3b8]',
  '[&::-webkit-slider-thumb]:bg-[#059669] [&::-moz-range-thumb]:bg-[#059669]',
  '[&::-webkit-slider-thumb]:bg-[#0891b2] [&::-moz-range-thumb]:bg-[#0891b2]',
  '[&::-webkit-slider-thumb]:bg-[#d97706] [&::-moz-range-thumb]:bg-[#d97706]',
  '[&::-webkit-slider-thumb]:bg-[#e11d48] [&::-moz-range-thumb]:bg-[#e11d48]',
  '[&::-webkit-slider-thumb]:bg-[#7c3aed] [&::-moz-range-thumb]:bg-[#7c3aed]',
];

export function colorFor(i: number): string {
  return SEGMENT_COLORS[i % SEGMENT_COLORS.length];
}
