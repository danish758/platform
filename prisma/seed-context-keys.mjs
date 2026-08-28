// One-time (idempotent) script registering the context keys acme-storefront
// already sends today (see its request-attributes.ts) for the Demo Consumer
// Project, so the targeting UI has something real to work with out of the
// box. Safe to re-run — skipDuplicates makes this a no-op after the first run.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const project = await prisma.project.findFirst({ where: { name: 'Demo Consumer Project' } });
if (!project) {
  console.error('No project named "Demo Consumer Project" found — nothing to seed.');
  process.exit(1);
}

const result = await prisma.contextKey.createMany({
  data: [
    { projectId: project.id, key: 'page', label: 'Page path', type: 'string' },
    { projectId: project.id, key: 'device', label: 'Device type', type: 'string' },
    { projectId: project.id, key: 'src', label: 'Campaign source', type: 'string' },
  ],
  skipDuplicates: true,
});

console.log(`Seeded ${result.count} context key(s) for project "${project.name}" (${project.id}).`);
await prisma.$disconnect();
