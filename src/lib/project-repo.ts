import { cache } from 'react';
import { prisma } from './db';

export const getProjectName = cache(async (projectId: string): Promise<string> => {
  const { name } = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { name: true } });
  return name;
});
