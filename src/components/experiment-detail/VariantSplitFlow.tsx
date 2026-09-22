import { FC } from 'react';
import { seriesColor } from '@/lib/series-colors';

type Variant = { key: string; label: string; weight: number };

type VariantSplitFlowProps = {
  variants: Variant[];
};

export const VariantSplitFlow: FC<VariantSplitFlowProps> = ({ variants }) => {
  const branchWidth = Math.max(280, variants.length * 140);
  const branchHeight = 54;
  const inset = 36;
  const dropXs = variants.map((_, index) =>
    variants.length === 1
      ? branchWidth / 2
      : inset + (index * (branchWidth - inset * 2)) / (variants.length - 1)
  );

  return (
    <div className="flex flex-col items-stretch">
      <svg
        viewBox={`0 0 ${branchWidth} ${branchHeight}`}
        width="100%"
        style={{ maxWidth: branchWidth }}
        className="mx-auto block overflow-visible"
      >
        {/* Top stem stops short of the label, and the line below it starts
            past the label's other side — a gap around the text instead of a
            rule drawn through it. */}
        <path d={`M${branchWidth / 2} 0 V12`} fill="none" className="stroke-border" strokeWidth={1.5} />
        <text x={branchWidth / 2} y={24} textAnchor="middle" className="fill-muted-foreground text-[10px] font-mono">
          % split
        </text>
        <path d={`M${branchWidth / 2} 28 V32`} fill="none" className="stroke-border" strokeWidth={1.5} />
        {variants.length > 1 && (
          <path
            d={`M${dropXs[0]} 32 H${dropXs[dropXs.length - 1]}`}
            fill="none"
            className="stroke-border"
            strokeWidth={1.5}
          />
        )}
        {dropXs.map((x, index) => (
          <path
            key={variants[index].key}
            d={`M${x} 32 V42 M${x - 5} 37 L${x} 44 L${x + 5} 37`}
            fill="none"
            className="stroke-border"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${variants.length}, minmax(0, 1fr))` }}>
        {variants.map((variant, index) => (
          <div key={variant.key} className="overflow-hidden rounded-lg border border-border bg-secondary/60">
            <div className="h-1" style={{ backgroundColor: seriesColor(index) }} />
            <div className="p-4">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold"
                  style={{ borderColor: seriesColor(index), color: seriesColor(index) }}
                >
                  {index}
                </span>
                {variant.label}
              </div>
              <div className="mt-2.5 text-xs text-muted-foreground">
                Split: <span className="font-mono tabular-nums text-foreground">{variant.weight}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
