"use client";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-gray-200 rounded-xl h-32"
          />
        ))}

      </div>

      <div className="bg-gray-200 rounded-xl h-80" />

      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-gray-200 rounded-xl h-72" />

        <div className="bg-gray-200 rounded-xl h-72" />

      </div>

    </div>
  );
}