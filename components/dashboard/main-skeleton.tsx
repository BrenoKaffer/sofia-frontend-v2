'use client';

export function MainSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-64 bg-muted animate-pulse rounded" />
    </div>
  );
}
