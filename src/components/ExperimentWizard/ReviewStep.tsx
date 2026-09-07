'use client';

import { useFormContext } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { OPERATOR_LABELS } from '@/lib/targeting-labels';
import type { ContextKeySummary, ExperimentFormValues } from './types';
import { contextKeyMap } from './utils';

export function ReviewStep({ contextKeys, serverErrors }: { contextKeys: ContextKeySummary[]; serverErrors: string[] }) {
  const { watch } = useFormContext<ExperimentFormValues>();
  const name = watch('name');
  const key = watch('key');
  const status = watch('status');
  const description = watch('description');
  const conversionEvent = watch('conversionEvent');
  const variants = watch('variants');
  const targeting = watch('targeting');
  const contextKeyByName = contextKeyMap(contextKeys);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <span className="font-medium">{name}</span>{' '}
        <code className="text-muted-foreground">{key}</code>{' '}
        <Badge variant="neutral">{status}</Badge>
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}
      <div>
        <span className="font-medium">Conversion event: </span>
        {conversionEvent || <span className="text-muted-foreground">none (visitor counts only)</span>}
      </div>
      <div>
        <div className="font-medium">Variants</div>
        <ul className="mt-1 list-disc pl-5">
          {variants.map((variant) => (
            <li key={variant.id}>
              {variant.label || variant.key}
              {variant.label && variant.label !== variant.key && (
                <code className="ml-1.5 text-xs text-muted-foreground">{variant.key}</code>
              )}{' '}
              — {variant.weight}%
            </li>
          ))}
        </ul>
      </div>
      {targeting.length > 0 && (
        <div>
          <div className="font-medium">Targeting</div>
          <ul className="mt-1 list-disc pl-5">
            {targeting.map((rule) => {
              const { label } = contextKeyByName.get(rule.attribute) || {};
              return (
                <li key={rule.id}>
                  {label || rule.attribute} {OPERATOR_LABELS[rule.operator]} {rule.value.join(', ')}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {serverErrors.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/20 p-3 text-destructive">
          {serverErrors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}
