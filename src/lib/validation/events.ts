import { z } from 'zod';
import { arrayField, identifier, numberField, objectField } from './fields';
import { CONVERSION_EVENT_MAX, EVENTS_PER_BATCH_MAX, EXPERIMENT_KEY_MAX, USER_ID_MAX, VARIANT_KEY_MAX } from './limits';
import { parseWith } from './parse';

const exposureSchema = objectField({
  userId: identifier(USER_ID_MAX),
  experimentKey: identifier(EXPERIMENT_KEY_MAX),
  variantKey: identifier(VARIANT_KEY_MAX),
});

// eventName is length-checked only, not format-checked like an experiment's
// conversionEvent — rejecting a name the SDK already sent would lose data.
const conversionSchema = objectField({
  userId: identifier(USER_ID_MAX),
  eventName: identifier(CONVERSION_EVENT_MAX),
  value: numberField().nullable().optional(),
});

// Items stay `unknown` here; each one is parsed individually by
// partitionEvents() so one bad event doesn't sink the whole batch.
export const eventsBatchSchema = z
  .object({
    exposures: arrayField(z.unknown()).default([]),
    conversions: arrayField(z.unknown()).default([]),
  })
  .refine((batch) => batch.exposures.length + batch.conversions.length <= EVENTS_PER_BATCH_MAX, {
    message: `a batch may contain at most ${EVENTS_PER_BATCH_MAX} events`,
  });

export type ExposureEvent = z.output<typeof exposureSchema>;
export type ConversionEvent = z.output<typeof conversionSchema>;
export type RejectedEvent = { type: 'exposure' | 'conversion'; index: number; errors: string[] };

type PartitionedEvents = {
  exposures: ExposureEvent[];
  conversions: ConversionEvent[];
  rejected: RejectedEvent[];
};

function unknownKeyErrors(exposure: ExposureEvent, variantKeysByExperiment: Map<string, Set<string>>): string[] {
  const variantKeys = variantKeysByExperiment.get(exposure.experimentKey);
  if (!variantKeys) return [`experimentKey "${exposure.experimentKey}" does not exist in this project`];
  if (!variantKeys.has(exposure.variantKey)) {
    return [`variantKey "${exposure.variantKey}" is not a variant of "${exposure.experimentKey}"`];
  }
  return [];
}

/**
 * Telemetry is best-effort: the SDK fires and forgets, so rejecting a whole
 * batch over one malformed event would silently drop every valid event
 * alongside it. Valid events are kept; invalid ones are reported back by
 * index so an SDK bug is still visible in the response.
 *
 * Exposures must also name a real experiment and one of its variants —
 * otherwise a typo or a stale SDK config would count as traffic in the
 * stats.
 */
export function partitionEvents(
  batch: z.output<typeof eventsBatchSchema>,
  variantKeysByExperiment: Map<string, Set<string>>
): PartitionedEvents {
  const rejected: RejectedEvent[] = [];

  const exposures = batch.exposures.flatMap((exposure, index) => {
    const result = parseWith(exposureSchema, exposure);
    const errors = result.success ? unknownKeyErrors(result.data, variantKeysByExperiment) : result.errors;
    if (result.success && errors.length === 0) return [result.data];
    rejected.push({ type: 'exposure', index, errors });
    return [];
  });

  const conversions = batch.conversions.flatMap((conversion, index) => {
    const result = parseWith(conversionSchema, conversion);
    if (result.success) return [result.data];
    rejected.push({ type: 'conversion', index, errors: result.errors });
    return [];
  });

  return { exposures, conversions, rejected };
}
