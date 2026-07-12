"use client";

import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "bg-blue-500",
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-800">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2 text-black">
            {value}
          </h2>
        </div>

        <div
          className={`p-4 rounded-full text-white ${color}`}
        >
          <Icon size={26} />
        </div>
      </div>
    </div>
  );
}