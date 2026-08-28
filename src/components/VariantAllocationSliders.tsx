'use client';

const SEGMENT_COLORS = ['#0f172a', '#059669', '#2563eb', '#d97706', '#e11d48', '#7c3aed'];

// Literal (not dynamically built) Tailwind arbitrary-variant classes, one
// set per palette color — Tailwind's JIT compiler only picks up class names
// it can see verbatim in source, so these can't be assembled from a
// template string at runtime. Colors the thumb pseudo-element on both
// engines (::-webkit-slider-thumb / ::-moz-range-thumb); the track's fill
// itself is a plain inline-style gradient (see trackBackground below), no
// Tailwind needed there since it's a real background property, not a
// pseudo-element.
const THUMB_COLOR_CLASSES = [
  '[&::-webkit-slider-thumb]:bg-[#0f172a] [&::-moz-range-thumb]:bg-[#0f172a]',
  '[&::-webkit-slider-thumb]:bg-[#059669] [&::-moz-range-thumb]:bg-[#059669]',
  '[&::-webkit-slider-thumb]:bg-[#2563eb] [&::-moz-range-thumb]:bg-[#2563eb]',
  '[&::-webkit-slider-thumb]:bg-[#d97706] [&::-moz-range-thumb]:bg-[#d97706]',
  '[&::-webkit-slider-thumb]:bg-[#e11d48] [&::-moz-range-thumb]:bg-[#e11d48]',
  '[&::-webkit-slider-thumb]:bg-[#7c3aed] [&::-moz-range-thumb]:bg-[#7c3aed]',
];

const THUMB_SHAPE_CLASSES =
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white ' +
  '[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow ' +
  '[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-none';

type Segment = { id: string; label: string; weight: number };

function colorFor(i: number): string {
  return SEGMENT_COLORS[i % SEGMENT_COLORS.length];
}

/** The track itself is just this element's own background (appearance-none
 * lets that show through as the visible track on both engines) — a hard
 * color-stop gradient at the current weight gives the "filled up to the
 * thumb" look, with a light gray remainder past it. */
function trackBackground(color: string, weight: number): string {
  return `linear-gradient(to right, ${color} 0%, ${color} ${weight}%, #e2e8f0 ${weight}%, #e2e8f0 100%)`;
}

/** A CSS conic-gradient donut summarizing the current split — purely a
 * readout, not interactive (the sliders below are the editing surface). */
function DonutChart({ segments }: { segments: Segment[] }) {
  let cumulative = 0;
  const stops = segments
    .map((segment, index) => {
      const start = cumulative;
      cumulative += segment.weight;
      return `${colorFor(index)} ${start}% ${cumulative}%`;
    })
    .join(', ');

  return (
    <div
      className="relative h-32 w-32 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${stops})` }}
    >
      <div className="absolute inset-[18%] rounded-full bg-white" />
    </div>
  );
}

/**
 * One independent slider per variant (each 0-100, its own track/thumb),
 * paired with an always-visible numeric stepper — matching AB Tasty's
 * traffic-allocation control exactly, rather than a single shared bar.
 * Dragging or typing a value for one variant redistributes the delta
 * proportionally across the others (rebalanceProportional() in
 * variant-weights.ts) so the total always stays at 100.
 */
export function VariantAllocationSliders({
  segments,
  onChangeWeight,
}: {
  segments: Segment[];
  onChangeWeight: (index: number, weight: number) => void;
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <DonutChart segments={segments} />

      <div className="flex-1 space-y-4">
        {segments.map((segment, index) => (
          <div key={segment.id}>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorFor(index) }} />
              <span className="truncate">{segment.label}</span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={segment.weight}
                onChange={(e) => onChangeWeight(index, Number(e.target.value))}
                className={`h-2 flex-1 cursor-pointer appearance-none rounded-full ${THUMB_SHAPE_CLASSES} ${THUMB_COLOR_CLASSES[index % THUMB_COLOR_CLASSES.length]}`}
                style={{ background: trackBackground(colorFor(index), segment.weight) }}
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={segment.weight}
                  onChange={(e) => onChangeWeight(index, Number(e.target.value))}
                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm tabular-nums"
                />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
