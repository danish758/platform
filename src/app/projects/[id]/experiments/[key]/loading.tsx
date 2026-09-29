import { Skeleton } from '@/components/ui/skeleton';

const PLACEHOLDER_CARDS = [0, 1, 2];

export default function ExperimentDetailLoading() {
  return (
    <div>
      <Skeleton className="h-4 w-72" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <Skeleton className="mt-6 h-8 w-72" />
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="mt-6 space-y-4">
        {PLACEHOLDER_CARDS.map((card) => (
          <div key={card} className="rounded-lg border border-border bg-card p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-64" />
            <Skeleton className="mt-6 h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
