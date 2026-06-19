export function SkeletonProductCard() {
  return (
    <div className="card animate-pulse">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-5 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
      <div className="skeleton aspect-square rounded-lg" />
      <div className="space-y-4">
        <div className="skeleton h-8 w-2/3 rounded" />
        <div className="skeleton h-6 w-1/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-4 w-4/6 rounded" />
        <div className="skeleton h-12 w-full rounded mt-8" />
      </div>
    </div>
  );
}
