'use client';

import type { TargetingOperator } from '@cro-engine/assignment-engine';
import { useFormContext } from 'react-hook-form';
import { TagInput } from '@/components/TagInput';
import { OPERATOR_LABELS, type ContextKeyType } from '@/lib/targeting-labels';
import type { ContextKeySummary, ExperimentFormValues, TargetingRow } from './types';
import { contextKeyMap, maxValuesForOperator, newId, operatorsForAttribute } from './utils';

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
      <p className="text-sm text-slate-600">
        Optional. Rules are AND&apos;d together — everyone is eligible if you skip this step.
      </p>
      {contextKeys.length === 0 && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
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
              <label className="block text-xs font-medium text-slate-700">Attribute</label>
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
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                {contextKeys.map((contextKey) => (
                  <option key={contextKey.id} value={contextKey.key}>
                    {contextKey.label || contextKey.key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Operator</label>
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
                className="mt-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                {allowedOperators.map((operator) => (
                  <option key={operator} value={operator}>
                    {OPERATOR_LABELS[operator]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700">Value</label>
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
              className="rounded-md px-2 py-2 text-sm text-rose-600"
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
        className="text-sm font-medium text-slate-700 underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
      >
        + Add targeting rule
      </button>
    </div>
  );
}
