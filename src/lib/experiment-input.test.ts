import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ExperimentConfig } from '@cro-engine/assignment-engine';
import { setupTestDatabase, TEST_DATABASE_URL } from '@/test/setup';

// validateExperimentInput is imported dynamically, inside beforeAll, AFTER
// DATABASE_URL is overridden below — not as a static top-level import.
// experiment-input.ts now transitively imports db.ts (targeting-validation
// needs a Prisma read), and db.ts's PrismaClient is constructed once, at
// module-evaluation time, bound to whatever DATABASE_URL is in process.env
// at that instant. A static import here would resolve before this file's
// beforeAll ever runs, permanently binding it to the real dev database
// instead of this throwaway test one — exactly the mistake that let earlier
// test runs write real rows into `cro_engine`. See route.test.ts (in
// app/api/v1/events) for the same dynamic-import discipline, established for
// the same reason.
let validateExperimentInput: typeof import('./experiment-input')['validateExperimentInput'];

beforeAll(async () => {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  setupTestDatabase();
  ({ validateExperimentInput } = await import('./experiment-input'));
}, 30_000);

afterAll(async () => {
  const { prisma } = await import('./db');
  await prisma.$disconnect();
});

async function seedProjectWithContextKeys() {
  const { prisma } = await import('./db');

  const account = await prisma.account.create({
    data: { email: `experiment-input-${crypto.randomUUID()}@example.com`, passwordHash: 'x' },
  });
  const project = await prisma.project.create({ data: { name: 'Test Project', accountId: account.id } });
  await prisma.contextKey.createMany({
    data: [
      { projectId: project.id, key: 'country', type: 'string' },
      { projectId: project.id, key: 'plan', type: 'string' },
      { projectId: project.id, key: 'age', type: 'number' },
    ],
  });

  return project.id;
}

const validConfig: ExperimentConfig = {
  key: 'homepage-cta',
  status: 'draft',
  variants: [
    { key: 'control', weight: 50 },
    { key: 'variant', weight: 50 },
  ],
};

describe('validateExperimentInput', () => {
  it('passes for a valid config with no targeting', async () => {
    const projectId = await seedProjectWithContextKeys();
    expect(await validateExperimentInput(projectId, validConfig)).toEqual([]);
  });

  it('surfaces validateConfig()\'s errors (weights not summing to 100)', async () => {
    const projectId = await seedProjectWithContextKeys();
    const config: ExperimentConfig = {
      ...validConfig,
      variants: [
        { key: 'control', weight: 50 },
        { key: 'variant', weight: 40 },
      ],
    };
    const errors = await validateExperimentInput(projectId, config);
    expect(errors.some((e) => e.includes('sum to 100'))).toBe(true);
  });

  it('accepts well-formed targeting rules of every operator, against registered context keys', async () => {
    const projectId = await seedProjectWithContextKeys();
    const config: ExperimentConfig = {
      ...validConfig,
      targeting: [
        { attribute: 'country', operator: 'eq', value: 'US' },
        { attribute: 'plan', operator: 'in', value: ['pro', 'enterprise'] },
        { attribute: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(await validateExperimentInput(projectId, config)).toEqual([]);
  });

  it('catches a gt/lt rule with a non-numeric value — a bug that would otherwise silently exclude everyone', async () => {
    const projectId = await seedProjectWithContextKeys();
    const config: ExperimentConfig = {
      ...validConfig,
      // Simulates a form bug sending a raw string instead of a coerced
      // number for a numeric operator.
      targeting: [{ attribute: 'age', operator: 'gt', value: '18' as unknown as number }],
    };
    const errors = await validateExperimentInput(projectId, config);
    expect(errors.some((e) => e.includes('age') && e.includes('numeric'))).toBe(true);
  });

  it('catches an in/notIn rule with a plain string instead of an array', async () => {
    const projectId = await seedProjectWithContextKeys();
    const config: ExperimentConfig = {
      ...validConfig,
      targeting: [{ attribute: 'plan', operator: 'in', value: 'pro' as unknown as string[] }],
    };
    const errors = await validateExperimentInput(projectId, config);
    expect(errors.some((e) => e.includes('plan') && e.includes('list'))).toBe(true);
  });

  it('catches an unknown targeting operator', async () => {
    const projectId = await seedProjectWithContextKeys();
    const config: ExperimentConfig = {
      ...validConfig,
      targeting: [{ attribute: 'country', operator: 'contains' as never, value: 'US' }],
    };
    const errors = await validateExperimentInput(projectId, config);
    expect(errors.some((e) => e.includes('unknown targeting operator'))).toBe(true);
  });

  it('combines both validators\' errors when both the config and targeting are invalid', async () => {
    const projectId = await seedProjectWithContextKeys();
    const config: ExperimentConfig = {
      key: '',
      status: 'draft',
      variants: [{ key: 'only-one', weight: 100 }],
      targeting: [{ attribute: '', operator: 'eq', value: '' }],
    };
    const errors = await validateExperimentInput(projectId, config);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects a targeting rule whose attribute is not a registered context key for the project', async () => {
    const projectId = await seedProjectWithContextKeys();
    const config: ExperimentConfig = {
      ...validConfig,
      targeting: [{ attribute: 'totally_fake', operator: 'eq', value: 'x' }],
    };
    const errors = await validateExperimentInput(projectId, config);
    expect(errors.some((e) => e.includes('totally_fake') && e.includes('not a registered context key'))).toBe(true);
  });

  it('rejects an operator that is valid in general but not for the context key\'s declared type', async () => {
    const projectId = await seedProjectWithContextKeys();
    const config: ExperimentConfig = {
      ...validConfig,
      // "country" is a string-typed key — gt/lt should be rejected for it.
      targeting: [{ attribute: 'country', operator: 'gt', value: 5 }],
    };
    const errors = await validateExperimentInput(projectId, config);
    expect(errors.some((e) => e.includes('country') && e.includes('not valid'))).toBe(true);
  });
});
