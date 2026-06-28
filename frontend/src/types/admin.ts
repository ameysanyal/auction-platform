export interface DashboardStats {
  totalUsers: number;
  totalAuctions: number;
  activeAuctions: number;
  soldAuctions: number;
  expiredAuctions: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
}

export interface AdminAuction {
  _id: string;
  title: string;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  currentBid: number;
  status: string;
  endTime: string;
  createdAt: string;
}

export interface AdminOrder {
  _id: string;
  winner: {
    _id: string;
    name: string;
  };
  auction: {
    _id: string;
    title: string;
  };
  amount: number;
  paymentStatus: string;
  createdAt: string;
}

export interface DashboardResponse {
  stats: DashboardStats;

  recentUsers: AdminUser[];

  recentAuctions: AdminAuction[];

  recentOrders: AdminOrder[];
}
