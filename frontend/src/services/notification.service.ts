import api from "./api";

class NotificationService {
  async getNotifications() {
    const { data } = await api.get("/notification");
    return data;
  }

  async markAsRead(id: string) {
    const { data } = await api.patch(
      `/notification/${id}/read`
    );

    return data;
  }

  async markAllAsRead() {
    const { data } =
      await api.patch(
        "/notification/read-all"
      );

    return data;
  }
}

export default new NotificationService();