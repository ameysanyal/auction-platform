"use client";

import { Inbox } from "lucide-react";

interface Props {
  title: string;
  description: string;
}

export default function EmptyState({
  title,
  description,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">

      <Inbox
        className="text-gray-400"
        size={60}
      />

      <h2 className="text-2xl font-semibold mt-4">
        {title}
      </h2>

      <p className="text-gray-800 mt-2">
        {description}
      </p>

    </div>
  );
}