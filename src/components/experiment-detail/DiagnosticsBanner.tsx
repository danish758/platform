import { FC } from 'react';
import type { SrmCheckResult } from '@/lib/srm';

type DiagnosticsBannerProps = {
  srm: SrmCheckResult;
  variantLabelByKey: Record<string, string>;
};

/**
 * Only rendered when srm.isMismatched — a passing SRM check has nothing
 * worth surfacing on its own (it's summarized by the "Diagnostics: None"
 * stat tile instead).
 */
export const DiagnosticsBanner: FC<DiagnosticsBannerProps> = ({ srm, variantLabelByKey }) => {
  const observedSummary = Object.values(srm.observed)
    .map((count) => `${Math.round((count / srm.totalVisitors) * 100)}%`)
    .join(' / ');
  const configuredSummary = Object.values(srm.expected)
    .map((expected) => `${Math.round((expected / srm.totalVisitors) * 100)}%`)
    .join(' / ');
  const variantOrder = Object.keys(srm.observed).map((key) => variantLabelByKey[key] ?? key).join(' vs. ');

  return (
    <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
      <p className="text-sm leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground">Sample ratio mismatch.</strong> Traffic split for{' '}
        <span className="font-mono text-foreground">{variantOrder}</span> is{' '}
        <span className="font-mono text-destructive">{observedSummary}</span> against a configured{' '}
        <span className="font-mono text-foreground">{configuredSummary}</span> (χ² ={' '}
        <span className="font-mono text-foreground">{srm.chiSquare.toFixed(2)}</span>, p ={' '}
        <span className="font-mono text-foreground">{srm.pValue.toFixed(3)}</span>). This usually means
        assignment or exposure logging is broken for one variant — check the SDK integration before trusting
        the results below.
      </p>
    </div>
  );
};
