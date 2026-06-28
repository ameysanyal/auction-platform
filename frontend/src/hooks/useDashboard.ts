"use client";

import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/services/dashboard.service";

export const useDashboard =
  () =>
    useQuery({
      queryKey: [
        "dashboard",
      ],
      queryFn: () =>
        dashboardService.getDashboard(),
    });

export const useMyAuctions =
  () =>
    useQuery({
      queryKey: [
        "my-auctions",
      ],
      queryFn: () =>
        dashboardService.getMyAuctions(),
    });

export const useMyBids =
  () =>
    useQuery({
      queryKey: ["my-bids"],
      queryFn: () =>
        dashboardService.getMyBids(),
    });

export const useWonAuctions =
  () =>
    useQuery({
      queryKey: [
        "won-auctions",
      ],
      queryFn: () =>
        dashboardService.getWonAuctions(),
    });

export const useOrders =
  () =>
    useQuery({
      queryKey: [
        "my-orders",
      ],
      queryFn: () =>
        dashboardService.getOrders(),
    });