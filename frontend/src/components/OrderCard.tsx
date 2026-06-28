"use client";

import { IOrder } from "@/types/order";

interface Props {
  order: IOrder;
}

export default function OrderCard({
  order,
}: Props) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">

      <h2 className="font-semibold">

        {order.auction.title}

      </h2>

      <p className="mt-2">

        Amount:
        {" "}
        ₹{order.amount}

      </p>

      <span
        className={`mt-4 inline-block rounded-full px-3 py-1 text-sm

        ${
          order.paymentStatus === "PAID"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {order.paymentStatus}
      </span>

    </div>
  );
}