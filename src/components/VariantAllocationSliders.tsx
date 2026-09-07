'use client';

import { Input } from '@/components/ui/input';
import { colorFor, THUMB_COLOR_CLASSES } from '@/lib/variant-palette';

const THUMB_SHAPE_CLASSES =
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background ' +
  '[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow ' +
  '[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-none';

type Segment = { id: string; label: string; weight: number };

/** The track itself is just this element's own background (appearance-none
 * lets that show through as the visible track on both engines) — a hard
 * color-stop gradient at the current weight gives the "filled up to the
 * thumb" look, with the border tone as the remainder. */
function trackBackground(color: string, weight: number): string {
  return `linear-gradient(to right, ${color} 0%, ${color} ${weight}%, #232c42 ${weight}%, #232c42 100%)`;
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
    <div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }}>
      <div className="absolute inset-[18%] rounded-full bg-card" />
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
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
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
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={segment.weight}
                  onChange={(e) => onChangeWeight(index, Number(e.target.value))}
                  className="w-16 tabular-nums"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
