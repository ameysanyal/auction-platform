import {
  LayoutDashboard,
  Gavel,
  Hammer,
  Trophy,
  ShoppingBag,
} from "lucide-react";

export const dashboardMenus = [
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