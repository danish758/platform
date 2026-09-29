'use client';

import { Plus, X } from 'lucide-react';
import { OperatorSelect } from '@/components/experiment-detail/OperatorSelect';
import { TagInput } from '@/components/TagInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  contextKeyMap,
  maxValuesForOperator,
  newId,
  operatorsForAttribute,
  type ContextKeySummary,
  type TargetingRow,
} from '@/lib/experiment-form';
import { type ContextKeyType } from '@/lib/targeting-labels';

export function TargetingRulesEditor({
  rows,
  onChange,
  contextKeys,
}: {
  rows: TargetingRow[];
  onChange: (rows: TargetingRow[]) => void;
  contextKeys: ContextKeySummary[];
}) {
  const contextKeyByName = contextKeyMap(contextKeys);

  function updateRule(index: number, rule: TargetingRow) {
    const next = [...rows];
    next[index] = rule;
    onChange(next);
  }

  function removeRule(ruleId: string) {
    onChange(rows.filter((rule) => rule.id !== ruleId));
  }

  function addRule() {
    const firstKey = contextKeys[0];
    const allowed = operatorsForAttribute(firstKey.key, contextKeyByName);
    onChange([...rows, { id: newId(), attribute: firstKey.key, operator: allowed[0], value: [] }]);
  }

  return (
    <div className="space-y-6">
      {contextKeys.length === 0 && (
        <p className="rounded-md bg-warning/10 p-3 text-sm text-warning">
          No context keys yet — add one from the project page before creating targeting rules.
        </p>
      )}
      {rows.map((rule, index) => {
        const { type: ruleKeyType } = contextKeyByName.get(rule.attribute) || {};
        const keyType = (ruleKeyType ?? 'string') as ContextKeyType;
        const allowedOperators = operatorsForAttribute(rule.attribute, contextKeyByName);
        return (
          <div key={rule.id} className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-sm">Attribute</Label>
              <Select
                value={rule.attribute}
                onValueChange={(nextAttribute) => {
                  const nextAllowed = operatorsForAttribute(nextAttribute, contextKeyByName);
                  updateRule(index, {
                    ...rule,
                    attribute: nextAttribute,
                    operator: nextAllowed.includes(rule.operator) ? rule.operator : nextAllowed[0],
                    value: nextAllowed.includes(rule.operator) ? rule.value : [],
                  });
                }}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contextKeys.map((contextKey) => (
                    <SelectItem key={contextKey.id} value={contextKey.key}>
                      {contextKey.label || contextKey.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Operator</Label>
              <OperatorSelect
                value={rule.operator}
                options={allowedOperators}
                onChange={(nextOperator) => {
                  const max = maxValuesForOperator(nextOperator);
                  updateRule(index, {
                    ...rule,
                    operator: nextOperator,
                    value: max ? rule.value.slice(0, max) : rule.value,
                  });
                }}
              />
            </div>
            <div className="flex-1">
              <Label className="text-sm">Value</Label>
              <TagInput
                values={rule.value}
                type={keyType}
                max={maxValuesForOperator(rule.operator)}
                onChange={(nextValue) => updateRule(index, { ...rule, value: nextValue })}
              />
            </div>
            <div>
              <Label className="invisible text-sm">Remove</Label>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeRule(rule.id)}
                aria-label="Remove rule"
                className="mt-2 h-12 w-12 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        disabled={contextKeys.length === 0}
        onClick={addRule}
        className="h-auto gap-2 px-1 text-base font-medium text-primary hover:bg-transparent hover:text-primary/80"
      >
        <Plus className="h-5 w-5" />
        Add targeting rule
      </Button>
    </div>
  );
}
