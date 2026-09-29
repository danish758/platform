// Single source of truth for input limits — the server schemas enforce
// these, and client forms should read the same constants so the two can't
// drift apart.
export const PROJECT_NAME_MIN = 3;
export const PROJECT_NAME_MAX = 80;
export const EXPERIMENT_NAME_MIN = 3;
export const EXPERIMENT_NAME_MAX = 120;
export const DESCRIPTION_MAX = 1000;
export const EXPERIMENT_KEY_MIN = 3;
export const EXPERIMENT_KEY_MAX = 64;
export const VARIANT_KEY_MAX = 64;
export const VARIANTS_MAX = 10;
export const TARGETING_RULES_MAX = 20;
export const TARGETING_VALUES_MAX = 100;
export const TARGETING_VALUE_MAX = 200;
export const LABEL_MIN = 2;
export const LABEL_MAX = 60;
export const CONVERSION_EVENT_MIN = 3;
export const CONVERSION_EVENT_MAX = 64;
export const CONTEXT_KEY_MIN = 2;
export const CONTEXT_KEY_MAX = 64;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
// Caps the work scrypt does per login/signup — hashing an unbounded
// password is a cheap way for an unauthenticated caller to burn CPU.
export const PASSWORD_MAX = 128;
export const USER_ID_MAX = 256;
export const EVENTS_PER_BATCH_MAX = 500;
