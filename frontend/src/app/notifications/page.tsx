"use client";

import NotificationItem from "@/components/NotificationItem";

import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardEmpty from "@/components/dashboard/DashboardEmpty";

import {
  useNotifications,
  useMarkAllRead,
} from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const {
    data,
    isLoading,
    isError,
  } = useNotifications();

  const {
    mutate: markAllRead,
  } = useMarkAllRead();

  if (isLoading)
    return <DashboardLoading />;

  if (isError)
    return (
      <DashboardEmpty
        title="Unable to load notifications"
        description="Please try again."
      />
    );

  if (!data.length)
    return (
      <DashboardEmpty
        title="No Notifications"
        description="You're all caught up."
      />
    );

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <h1 className="text-3xl font-bold">
          Notifications
        </h1>

        <button
          onClick={() =>
            markAllRead()
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Mark All Read
        </button>

      </div>

      <div className="space-y-4">

        {data.map(
          (notification: any) => (
            <NotificationItem
              key={
                notification._id
              }
              notification={
                notification
              }
            />
          )
        )}

      </div>

    </div>
  );
}