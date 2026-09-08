import { FC } from 'react';
import type { DailySeriesPoint } from '@/lib/daily-exposures';
import { seriesColor } from '@/lib/series-colors';

type Variant = { key: string; label: string };

type DailyExposuresChartProps = { series: DailySeriesPoint[]; variants: Variant[] };

const VIEW_WIDTH = 760;
const VIEW_HEIGHT = 170;
const PAD_LEFT = 24;
const PAD_RIGHT = 4;
const PAD_TOP = 4;
const PAD_BOTTOM = 22;

export const DailyExposuresChart: FC<DailyExposuresChartProps> = ({ series, variants }) => {
  const plotWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxCount = Math.max(1, ...series.flatMap((day) => variants.map((variant) => day.countsByVariant[variant.key] ?? 0)));
  const yTicks = Array.from({ length: maxCount + 1 }, (_, tick) => tick).filter(
    (tick) => maxCount <= 6 || tick % Math.ceil(maxCount / 6) === 0
  );

  const groupWidth = plotWidth / Math.max(series.length, 1);
  const barWidth = Math.min(10, groupWidth / (variants.length + 1));
  const barGap = 2;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
        {variants.map((variant, index) => (
          <span key={variant.key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: seriesColor(index) }}
            />
            {variant.label}
            {index === 0 && <span className="text-muted-foreground/70">(baseline)</span>}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} width="100%" className="block overflow-visible">
        {yTicks.map((tick) => {
          const y = PAD_TOP + plotHeight - (tick / maxCount) * plotHeight;
          return (
            <g key={tick}>
              <line x1={PAD_LEFT} x2={VIEW_WIDTH - PAD_RIGHT} y1={y} y2={y} className="stroke-border" strokeWidth={1} />
              <text x={PAD_LEFT - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {tick}
              </text>
            </g>
          );
        })}

        {series.map((day, dayIndex) => {
          const groupCenter = PAD_LEFT + dayIndex * groupWidth + groupWidth / 2;
          const totalBarsWidth = variants.length * barWidth + (variants.length - 1) * barGap;
          const startX = groupCenter - totalBarsWidth / 2;

          return (
            <g key={day.date}>
              {variants.map((variant, variantIndex) => {
                const count = day.countsByVariant[variant.key] ?? 0;
                const barHeight = Math.max(count > 0 ? 1.5 : 0, (count / maxCount) * plotHeight);
                const x = startX + variantIndex * (barWidth + barGap);
                const y = PAD_TOP + plotHeight - barHeight;
                return (
                  <rect
                    key={variant.key}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={2}
                    style={{ fill: seriesColor(variantIndex) }}
                  >
                    <title>
                      {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} —{' '}
                      {variant.label}: {count}
                    </title>
                  </rect>
                );
              })}
              <text
                x={groupCenter}
                y={VIEW_HEIGHT - 4}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {new Date(day.date).getUTCDate()}
              </text>
            </g>
          );
        })}

        <line
          x1={PAD_LEFT}
          x2={VIEW_WIDTH - PAD_RIGHT}
          y1={PAD_TOP + plotHeight}
          y2={PAD_TOP + plotHeight}
          className="stroke-border"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
};
