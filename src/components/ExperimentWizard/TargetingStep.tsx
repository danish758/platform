'use client';

import type { TargetingOperator } from '@cro-engine/assignment-engine';
import { useFormContext } from 'react-hook-form';
import { TagInput } from '@/components/TagInput';
import { Label } from '@/components/ui/label';
import { OPERATOR_LABELS, type ContextKeyType } from '@/lib/targeting-labels';
import type { ContextKeySummary, ExperimentFormValues, TargetingRow } from './types';
import { contextKeyMap, maxValuesForOperator, newId, operatorsForAttribute } from './utils';

const SELECT_CLASSES =
  'mt-1 flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function TargetingStep({ contextKeys }: { contextKeys: ContextKeySummary[] }) {
  const { watch, setValue } = useFormContext<ExperimentFormValues>();
  const targeting = watch('targeting');
  const contextKeyByName = contextKeyMap(contextKeys);

  function updateRule(index: number, rule: TargetingRow) {
    const next = [...targeting];
    next[index] = rule;
    setValue('targeting', next);
  }

  function removeRule(ruleId: string) {
    setValue('targeting', targeting.filter((rule) => rule.id !== ruleId));
  }

  function addRule() {
    const firstKey = contextKeys[0];
    const allowed = operatorsForAttribute(firstKey.key, contextKeyByName);
    setValue('targeting', [...targeting, { id: newId(), attribute: firstKey.key, operator: allowed[0], value: [] }]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Optional. Rules are AND&apos;d together — everyone is eligible if you skip this step.
      </p>
      {contextKeys.length === 0 && (
        <p className="rounded-md bg-warning/10 p-3 text-sm text-warning">
          No context keys yet — add one from the project page before creating targeting rules.
        </p>
      )}
      {targeting.map((rule, index) => {
        const { type: ruleKeyType } = contextKeyByName.get(rule.attribute) || {};
        const keyType = (ruleKeyType ?? 'string') as ContextKeyType;
        const allowedOperators = operatorsForAttribute(rule.attribute, contextKeyByName);
        return (
          <div key={rule.id} className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Attribute</Label>
              <select
                value={rule.attribute}
                onChange={(e) => {
                  const nextAttribute = e.target.value;
                  const nextAllowed = operatorsForAttribute(nextAttribute, contextKeyByName);
                  updateRule(index, {
                    ...rule,
                    attribute: nextAttribute,
                    operator: nextAllowed.includes(rule.operator) ? rule.operator : nextAllowed[0],
                    value: nextAllowed.includes(rule.operator) ? rule.value : [],
                  });
                }}
                className={`${SELECT_CLASSES} w-full`}
              >
                {contextKeys.map((contextKey) => (
                  <option key={contextKey.id} value={contextKey.key}>
                    {contextKey.label || contextKey.key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Operator</Label>
              <select
                value={rule.operator}
                onChange={(e) => {
                  const nextOperator = e.target.value as TargetingOperator;
                  const max = maxValuesForOperator(nextOperator);
                  updateRule(index, {
                    ...rule,
                    operator: nextOperator,
                    value: max ? rule.value.slice(0, max) : rule.value,
                  });
                }}
                className={SELECT_CLASSES}
              >
                {allowedOperators.map((operator) => (
                  <option key={operator} value={operator}>
                    {OPERATOR_LABELS[operator]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Value</Label>
              <TagInput
                values={rule.value}
                type={keyType}
                max={maxValuesForOperator(rule.operator)}
                onChange={(nextValue) => updateRule(index, { ...rule, value: nextValue })}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRule(rule.id)}
              className="rounded-md px-2 py-2 text-sm text-destructive"
            >
              Remove
            </button>
          </div>
        );
      })}
      <button
        type="button"
        disabled={contextKeys.length === 0}
        onClick={addRule}
        className="text-sm font-medium text-foreground underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
      >
        + Add targeting rule
      </button>
    </div>
  );
}
