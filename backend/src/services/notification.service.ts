import Notification, { NotificationType, type INotification } from "../models/notification.model.js";
import { Types } from "mongoose";
import { appLogger } from "../config/logger.js";

// Define an interface for the creation parameters
interface ICreateNotificationInput {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: {
    auctionId?: string | Types.ObjectId;
    orderId?: string | Types.ObjectId;
  };
}

class NotificationService {
  /**
   * Creates a new notification for a user
   */
  async create({
    userId,
    type,
    title,
    message,
    metadata = {},
  }: ICreateNotificationInput): Promise<INotification> {
    appLogger.info(
      `[NotificationService] Creating notification for user ${userId} — type=${type} title="${title}"`
    );

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      metadata,
    });

    appLogger.debug(
      `[NotificationService] Notification ${notification._id} created for user ${userId}`
    );

    return notification;
  }

  /**
   * Marks a specific notification as read
   */
  async markAsRead(notificationId: string | Types.ObjectId): Promise<INotification | null> {
    appLogger.info(`[NotificationService] Marking notification ${notificationId} as read`);

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    ).exec();

    if (!notification) {
      appLogger.warn(`[NotificationService] Notification ${notificationId} not found`);
    } else {
      appLogger.debug(`[NotificationService] Notification ${notificationId} marked as read`);
    }

    return notification;
  }

  /**
   * Retrieves all notifications for a specific user, sorted by newest first
   */
  async getUserNotifications(userId: string | Types.ObjectId): Promise<INotification[]> {
    appLogger.debug(`[NotificationService] Fetching notifications for user ${userId}`);

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .exec();

    appLogger.debug(
      `[NotificationService] Found ${notifications.length} notification(s) for user ${userId}`
    );

    return notifications;
  }
}

// Export a singleton instance of the service using ES Modules syntax
export default new NotificationService();