"use client";

import { INotification } from "@/types/notification";

import { useMarkAsRead } from "@/hooks/useNotifications";

interface Props {
  notification: INotification;
}

export default function NotificationItem({
  notification,
}: Props) {
  const {
    mutate: markRead,
  } = useMarkAsRead();

  return (
    <div
      onClick={() =>
        !notification.read &&
        markRead(notification._id)
      }
      className={`border rounded-lg p-4 cursor-pointer transition

      ${
        notification.read
          ? "bg-white"
          : "bg-blue-50"
      }`}
    >
      <div className="flex justify-between">

        <h3 className="font-semibold">
          {notification.title}
        </h3>

        {!notification.read && (
          <span className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
        )}

      </div>

      <p className="mt-2 text-sm text-gray-600">
        {notification.message}
      </p>

      <p className="text-xs text-gray-400 mt-3">
        {new Date(
          notification.createdAt
        ).toLocaleString()}
      </p>

    </div>
  );
}