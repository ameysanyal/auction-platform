"use client";

import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  color = "bg-blue-600",
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-sm text-gray-800">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            {value}
          </h2>

        </div>

        <div
          className={`${color} text-white rounded-xl p-4`}
        >
          <Icon size={28} />
        </div>

      </div>

    </div>
  );
}