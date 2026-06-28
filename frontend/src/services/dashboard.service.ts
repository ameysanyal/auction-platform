import api from "./api";

class DashboardService {
  async getDashboard() {
    const { data } =
      await api.get("/dashboard");

    return data;
  }

  async getMyAuctions() {
    const { data } =
      await api.get("/auction/my");

    return data;
  }

  async getMyBids() {
    const { data } =
      await api.get("/bid/my");

    return data;
  }

  async getWonAuctions() {
    const { data } =
      await api.get("/order/won");

    return data;
  }

  async getOrders() {
    const { data } =
      await api.get("/order/my");

    return data;
  }
}

export default new DashboardService();