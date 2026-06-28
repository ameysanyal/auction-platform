"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Gavel,
  Hammer,
  Trophy,
  ShoppingBag,
} from "lucide-react";

const menus = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Auctions",
    href: "/dashboard/my-auctions",
    icon: Gavel,
  },
  {
    label: "My Bids",
    href: "/dashboard/my-bids",
    icon: Hammer,
  },
  {
    label: "Won Auctions",
    href: "/dashboard/won-auctions",
    icon: Trophy,
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingBag,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-white border-r h-screen sticky top-0">

      <div className="p-6 border-b">

        <h2 className="text-2xl font-bold">
          Dashboard
        </h2>

      </div>

      <nav className="p-4 space-y-2">

        {menus.map((menu) => {
          const Icon = menu.icon;

          const active =
            pathname === menu.href;

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition
              ${
                active
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <Icon size={20} />

              {menu.label}
            </Link>
          );
        })}

      </nav>

    </aside>
  );
}