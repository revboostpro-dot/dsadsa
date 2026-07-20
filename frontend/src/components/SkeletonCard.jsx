/** Skeleton loading card placeholder */
export default function SkeletonCard() {
  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <div className="skeleton h-4 w-32 mb-2 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="flex justify-between">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  );
}
