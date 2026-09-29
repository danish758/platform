import { Skeleton } from '@/components/ui/skeleton';

const PLACEHOLDER_CARDS = [0, 1, 2, 3, 4, 5];

export default function ProjectsLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl overflow-y-auto px-6 py-12">
      <div className="mb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDER_CARDS.map((card) => (
          <div key={card} className="flex min-h-[132px] flex-col rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            </div>
            <div className="mt-auto flex gap-4 border-t border-border pt-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
