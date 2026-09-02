'use client';

export function SignalCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>

      <div className="mb-4">
        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-2 bg-gray-200 rounded-full w-full"></div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mt-1"></div>
        </div>

        <div className="pt-3 border-t border-[#E0E3EB]">
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E0E3FB]">
          <div className="h-2 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}
