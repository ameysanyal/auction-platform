import api from "./api";

export const getMyOrders = async () => {
  const { data } = await api.get("/orders");
  return data;
};

export const createCheckoutSession = async (orderId: string) => {
  const { data } = await api.post(`/payments/checkout/${orderId}`);
  return data;
};

export const confirmPaymentSession = async (sessionId: string) => {
  const { data } = await api.post(`/payments/confirm/${sessionId}`);
  return data;
};
