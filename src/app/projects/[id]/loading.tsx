import { Skeleton } from '@/components/ui/skeleton';

const PLACEHOLDER_ROWS = [0, 1, 2, 3, 4];

// Shared by every section under a project (overview, dashboard, experiments,
// api keys, context keys), so this stays a neutral header-plus-rows shape
// rather than mirroring any one of them.
export default function ProjectSectionLoading() {
  return (
    <div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-6 h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-80" />

      <div className="mt-10 space-y-3">
        {PLACEHOLDER_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
