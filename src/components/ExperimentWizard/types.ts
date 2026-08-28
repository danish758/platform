import type { ExperimentConfig, TargetingOperator } from '@cro-engine/assignment-engine';

export type VariantRow = { id: string; key: string; keyEdited: boolean; weight: number; label: string };
export type TargetingRow = { id: string; attribute: string; operator: TargetingOperator; value: string[] };
export type ContextKeySummary = { id: string; key: string; label: string | null; type: string };

export type ExperimentInitialData = {
  key: string;
  name: string;
  description: string;
  conversionEvent: string;
  status: ExperimentConfig['status'];
  variants: VariantRow[];
  targeting: TargetingRow[];
};

export type ExperimentFormValues = {
  name: string;
  key: string;
  keyEdited: boolean;
  description: string;
  conversionEvent: string;
  status: ExperimentConfig['status'];
  variants: VariantRow[];
  targeting: TargetingRow[];
};
