-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('draft', 'running', 'stopped');

-- AlterTable
-- Cast existing values instead of Prisma's default drop+recreate diff, which
-- would silently discard every row's real status and replace it with the
-- default. All existing values are already 'draft'/'running'/'stopped'
-- (verified via `SELECT DISTINCT status FROM "Experiment"` before writing
-- this migration), so the cast is safe.
ALTER TABLE "Experiment" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "ExperimentStatus" USING ("status"::"ExperimentStatus"),
ALTER COLUMN "status" SET DEFAULT 'draft';
