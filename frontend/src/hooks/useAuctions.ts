"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createAuction,
  getAuctionById,
  getAuctions,
} from "@/services/auction.service";

export const useAuctions = (
  page: number
) =>
  useQuery({
    queryKey: [
      "auctions",
      page,
    ],
    queryFn: () =>
      getAuctions(page),
  });

export const useAuction =
  (id: string) =>
    useQuery({
      queryKey: [
        "auction",
        id,
      ],
      queryFn: () =>
        getAuctionById(id),

      enabled: !!id,
    });

export const useCreateAuction =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        createAuction,

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "auctions",
            ],
          }
        );
      },
    });
  };