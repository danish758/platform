'use client';

import { useFormContext } from 'react-hook-form';
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
        <code className="text-slate-500">{key}</code>{' '}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{status}</span>
      </div>
      {description && <p className="text-slate-600">{description}</p>}
      <div>
        <span className="font-medium">Conversion event: </span>
        {conversionEvent || <span className="text-slate-400">none (visitor counts only)</span>}
      </div>
      <div>
        <div className="font-medium">Variants</div>
        <ul className="mt-1 list-disc pl-5">
          {variants.map((variant) => (
            <li key={variant.id}>
              {variant.label || variant.key}
              {variant.label && variant.label !== variant.key && <code className="ml-1.5 text-xs text-slate-400">{variant.key}</code>}
              {' '}— {variant.weight}%
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
                  {label || rule.attribute} {OPERATOR_LABELS[rule.operator]}{' '}
                  {rule.value.join(', ')}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {serverErrors.length > 0 && (
        <div className="rounded-md bg-rose-50 p-3 text-rose-800">
          {serverErrors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}
