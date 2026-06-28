"use client";

export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">

      <div className="grid md:grid-cols-4 gap-6">
        {[1,2,3,4].map((item)=>(
          <div
            key={item}
            className="bg-gray-200 rounded-xl h-32"
          />
        ))}
      </div>

      <div className="bg-gray-200 rounded-xl h-80" />

    </div>
  );
}