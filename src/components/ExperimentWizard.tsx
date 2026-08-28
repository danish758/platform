'use client';

import { validateConfig, type ExperimentConfig, type TargetingOperator } from '@cro-engine/assignment-engine';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TagInput } from './TagInput';
import { VariantAllocationSliders } from './VariantAllocationSliders';
import { OPERATOR_LABELS, OPERATORS_BY_TYPE, type ContextKeyType } from '@/lib/targeting-labels';
import { equalSplit, rebalanceProportional } from '@/lib/variant-weights';

type VariantRow = { id: string; key: string; keyEdited: boolean; weight: number; label: string };
type TargetingRow = { id: string; attribute: string; operator: TargetingOperator; value: string[] };
type ContextKeySummary = { id: string; key: string; label: string | null; type: string };

export type ExperimentInitialData = {
  key: string;
  name: string;
  description: string;
  conversionEvent: string;
  status: ExperimentConfig['status'];
  variants: VariantRow[];
  targeting: TargetingRow[];
};

function newId(): string {
  return crypto.randomUUID();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Coerces each targeting row's chip values per its operator, matching the
 * shape the server's validateTargeting()/evaluateRule() expect — gt/lt need
 * a real number, in/notIn a real array, eq/neq a plain string. The
 * TagInput's `max` prop already keeps eq/gt/lt down to exactly one chip. */
function coerceTargetingRow(row: TargetingRow): { attribute: string; operator: TargetingOperator; value: string | number | string[] } {
  if (row.operator === 'gt' || row.operator === 'lt') {
    return { attribute: row.attribute, operator: row.operator, value: Number(row.value[0]) };
  }
  if (row.operator === 'in' || row.operator === 'notIn') {
    return { attribute: row.attribute, operator: row.operator, value: row.value };
  }
  return { attribute: row.attribute, operator: row.operator, value: row.value[0] ?? '' };
}

const STEPS = ['Basics', 'Variants', 'Targeting', 'Review'] as const;

export function ExperimentWizard({
  projectId,
  mode,
  initial,
  contextKeys,
}: {
  projectId: string;
  mode: 'create' | 'edit';
  initial?: ExperimentInitialData;
  contextKeys: ContextKeySummary[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const {
    name: initialName = '',
    key: initialKey = '',
    description: initialDescription = '',
    conversionEvent: initialConversionEvent = '',
    status: initialStatus = 'draft',
    variants: initialVariants = [
      { id: newId(), key: 'control', keyEdited: true, weight: 50, label: 'Control' },
      { id: newId(), key: 'variant', keyEdited: true, weight: 50, label: 'Variant' },
    ],
    targeting: initialTargeting = [],
  } = initial || {};

  const [name, setName] = useState(initialName);
  const [key, setKey] = useState(initialKey);
  const [keyEdited, setKeyEdited] = useState(mode === 'edit');
  const [description, setDescription] = useState(initialDescription);
  const [conversionEvent, setConversionEvent] = useState(initialConversionEvent);
  const [status, setStatus] = useState<ExperimentConfig['status']>(initialStatus);
  const [variants, setVariants] = useState<VariantRow[]>(initialVariants);

  function handleVariantLabelChange(index: number, label: string) {
    const next = [...variants];
    const row = next[index];
    next[index] = { ...row, label, key: row.keyEdited ? row.key : slugify(label) };
    setVariants(next);
  }

  function handleWeightInputChange(index: number, newWeight: number) {
    const nextWeights = rebalanceProportional(variants.map((variant) => variant.weight), index, newWeight);
    setVariants(variants.map((variant, variantIndex) => ({ ...variant, weight: nextWeights[variantIndex] })));
  }
  const [targeting, setTargeting] = useState<TargetingRow[]>(initialTargeting);

  const contextKeyByName = new Map(contextKeys.map((contextKey) => [contextKey.key, contextKey]));
  function operatorsFor(attribute: string): TargetingOperator[] {
    const { type } = contextKeyByName.get(attribute) || {};
    return OPERATORS_BY_TYPE[(type ?? 'string') as ContextKeyType];
  }
  function maxValuesFor(operator: TargetingOperator): number | undefined {
    return operator === 'in' || operator === 'notIn' ? undefined : 1;
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!keyEdited) setKey(slugify(value));
  }

  const clientConfig: ExperimentConfig = {
    key: key || 'placeholder',
    status,
    variants: variants.map((variant) => ({ key: variant.key, weight: variant.weight })),
  };
  // Live feedback as the admin types — the same validateConfig() the server
  // re-checks on submit, imported directly since assignment-engine is
  // dependency-free/isomorphic (works in the browser bundle for free).
  const liveErrors = validateConfig(clientConfig);

  async function handleSubmit() {
    setSubmitting(true);
    setServerErrors([]);

    const payload = {
      key,
      name,
      description,
      conversionEvent,
      status,
      variants: variants.map((variant) => ({ key: variant.key, weight: variant.weight, label: variant.label.trim() || undefined })),
      // Always send a real array, even when empty — the PATCH route treats
      // a genuinely missing `targeting` key as "leave it unchanged" (partial
      // update semantics), so sending `undefined` here for "no rules" was
      // indistinguishable from "don't touch existing targeting," meaning
      // removing every rule in the edit wizard could never actually clear
      // them. An empty array and `undefined` are equivalent everywhere
      // targeting actually gets evaluated (assign() checks `.length > 0`),
      // so this only matters for the update's own missing-vs-empty signal.
      targeting: targeting.map(coerceTargetingRow),
    };

    const url = mode === 'create'
      ? `/api/projects/${projectId}/experiments`
      : `/api/projects/${projectId}/experiments/${initialKey}`;
    const res = await fetch(url, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerErrors(body.errors ?? [body.error ?? 'Something went wrong']);
      setSubmitting(false);
      return;
    }

    router.push(`/projects/${projectId}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 flex gap-2">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`flex-1 border-b-2 pb-2 text-center text-xs font-medium ${
              index === step ? 'border-slate-900 text-slate-900' : 'border-slate-200 text-slate-400'
            }`}
          >
            {index + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Homepage CTA copy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Key</label>
            <input
              value={key}
              disabled={mode === 'edit'}
              onChange={(e) => {
                setKeyEdited(true);
                setKey(e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono disabled:bg-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">Used by the SDK to look up this experiment. Lowercase, hyphens only.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Conversion event (optional)</label>
            <input
              value={conversionEvent}
              onChange={(e) => setConversionEvent(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
              placeholder="e.g. purchase_completed"
            />
            <p className="mt-1 text-xs text-slate-500">
              The event name your app sends via <code>client.trackConversion()</code> for this
              experiment&apos;s goal. Leave blank to only track visitor counts.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ExperimentConfig['status'])}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="draft">draft — not yet live</option>
              <option value="running">running — live traffic is bucketed</option>
              <option value="stopped">stopped — no longer bucketing</option>
            </select>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Label is just for this dashboard; variant key is what the SDK actually sends.
          </p>

          <VariantAllocationSliders
            segments={variants.map((variant) => ({ id: variant.id, label: variant.label || variant.key || 'variant', weight: variant.weight }))}
            onChangeWeight={handleWeightInputChange}
          />

          {variants.map((variant, index) => (
            <div key={variant.id} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Label</label>
                <input
                  value={variant.label}
                  onChange={(e) => handleVariantLabelChange(index, e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. Green button"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Variant key</label>
                <input
                  value={variant.key}
                  onChange={(e) => {
                    const next = [...variants];
                    next[index] = { ...variant, key: e.target.value, keyEdited: true };
                    setVariants(next);
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const remaining = variants.filter((otherVariant) => otherVariant.id !== variant.id);
                  setVariants(remaining.map((remainingVariant, remainingIndex) => ({ ...remainingVariant, weight: equalSplit(remaining.length)[remainingIndex] })));
                }}
                disabled={variants.length <= 2}
                className="rounded-md px-2 py-2 text-sm text-rose-600 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const nextVariants = [...variants, { id: newId(), key: '', keyEdited: false, weight: 0, label: '' }];
              setVariants(nextVariants.map((variant, index) => ({ ...variant, weight: equalSplit(nextVariants.length)[index] })));
            }}
            className="text-sm font-medium text-slate-700 underline"
          >
            + Add variant
          </button>

          {liveErrors.length > 0 && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {liveErrors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
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
            const allowedOperators = operatorsFor(rule.attribute);
            return (
              <div key={rule.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700">Attribute</label>
                  <select
                    value={rule.attribute}
                    onChange={(e) => {
                      const nextAttribute = e.target.value;
                      const nextAllowed = operatorsFor(nextAttribute);
                      const next = [...targeting];
                      next[index] = {
                        ...rule,
                        attribute: nextAttribute,
                        operator: nextAllowed.includes(rule.operator) ? rule.operator : nextAllowed[0],
                        value: nextAllowed.includes(rule.operator) ? rule.value : [],
                      };
                      setTargeting(next);
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
                      const next = [...targeting];
                      const max = maxValuesFor(nextOperator);
                      next[index] = {
                        ...rule,
                        operator: nextOperator,
                        value: max ? rule.value.slice(0, max) : rule.value,
                      };
                      setTargeting(next);
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
                    max={maxValuesFor(rule.operator)}
                    onChange={(nextValue) => {
                      const next = [...targeting];
                      next[index] = { ...rule, value: nextValue };
                      setTargeting(next);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setTargeting(targeting.filter((otherRule) => otherRule.id !== rule.id))}
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
            onClick={() => {
              const firstKey = contextKeys[0];
              const allowed = operatorsFor(firstKey.key);
              setTargeting([...targeting, { id: newId(), attribute: firstKey.key, operator: allowed[0], value: [] }]);
            }}
            className="text-sm font-medium text-slate-700 underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            + Add targeting rule
          </button>
        </div>
      )}

      {step === 3 && (
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
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-30"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && (!name || !key)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || liveErrors.length > 0}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
          >
            {submitting ? 'Saving…' : mode === 'create' ? 'Create experiment' : 'Save changes'}
          </button>
        )}
      </div>
    </div>
  );
}
