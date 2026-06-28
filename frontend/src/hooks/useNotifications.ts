"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import notificationService from "@/services/notification.service";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      notificationService.getNotifications(),
  });
}

export function useMarkAsRead() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      notificationService.markAsRead(
        id
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "notifications",
        ],
      });
    },
  });
}

export function useMarkAllRead() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: () =>
      notificationService.markAllAsRead(),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "notifications",
        ],
      });
    },
  });
}