"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as adminService from "@/services/admin.service";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: adminService.getDashboardStats,
  });

export const useUsers = (page: number) =>
  useQuery({
    queryKey: ["users", page],
    queryFn: () => adminService.getUsers(page),
  });

export const useAuctions = (page: number) =>
  useQuery({
    queryKey: ["admin-auctions", page],
    queryFn: () => adminService.getAuctions(page),
  });

export const useOrders = (page: number) =>
  useQuery({
    queryKey: ["orders", page],
    queryFn: () => adminService.getOrders(page),
  });

export const useDeleteAuction = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: adminService.deleteAuction,

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["admin-auctions"],
      }),
  });
};

export const useSuspendAuction = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: adminService.suspendAuction,

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["admin-auctions"],
      }),
  });
};
