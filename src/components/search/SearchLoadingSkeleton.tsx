export default function SearchLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => ( // 3つのスケルトンを表示
        <div key={i} className="border p-4 rounded-md shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div> {/* Title Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div> {/* Content Line 1 */}
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div> {/* Content Line 2 */}
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-1/4"></div> {/* Author Skeleton */}
            <div className="h-3 bg-gray-200 rounded w-1/4"></div> {/* Date Skeleton */}
          </div>
        </div>
      ))}
    </div>
  );
}
