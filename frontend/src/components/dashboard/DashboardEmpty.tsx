"use client";

import { Inbox } from "lucide-react";

interface DashboardEmptyProps {
  title: string;
  description: string;
}

export default function DashboardEmpty({
  title,
  description,
}: DashboardEmptyProps) {
  return (
    <div className="bg-white border rounded-xl p-16 flex flex-col items-center justify-center">

      <Inbox
        className="text-gray-400"
        size={70}
      />

      <h2 className="mt-5 text-2xl font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-gray-500 text-center">
        {description}
      </p>

    </div>
  );
}