import api from "./api";

export const getDashboardStats = async () => {
  const { data } = await api.get("/admin/dashboard");

  return data;
};

export const getUsers = async (
  page = 1,
  limit = 10
) => {
  const { data } = await api.get(
    `/admin/users?page=${page}&limit=${limit}`
  );

  return data;
};

export const getAuctions = async (
  page = 1,
  limit = 10
) => {
  const { data } = await api.get(
    `/admin/auctions?page=${page}&limit=${limit}`
  );

  return data;
};

export const getOrders = async (
  page = 1,
  limit = 10
) => {
  const { data } = await api.get(
    `/admin/orders?page=${page}&limit=${limit}`
  );

  return data;
};

export const updateUserRole = async (
  userId: string,
  role: string
) => {
  const { data } = await api.patch(
    `/admin/users/${userId}/role`,
    { role }
  );

  return data;
};

export const suspendAuction = async (
  auctionId: string
) => {
  const { data } = await api.patch(
    `/admin/auctions/${auctionId}/suspend`
  );

  return data;
};

export const deleteAuction = async (
  auctionId: string
) => {
  const { data } = await api.delete(
    `/admin/auctions/${auctionId}`
  );

  return data;
};

export const getDashboard = async () => {
  const { data } = await api.get(
    "/admin/dashboard"
  );

  return data;
};