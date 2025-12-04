const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

// Get notifications for user
module.exports.getNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "username avatarImage fullName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.json({
      status: true,
      notifications,
      unreadCount,
    });
  } catch (ex) {
    next(ex);
  }
};

// Mark notification as read
module.exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId, userId } = req.body;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.json({ msg: "Notification not found", status: false });
    }

    if (notification.recipient.toString() !== userId) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return res.json({ status: true, notification });
  } catch (ex) {
    next(ex);
  }
};

// Mark all notifications as read
module.exports.markAllAsRead = async (req, res, next) => {
  try {
    const { userId } = req.body;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.json({ status: true, msg: "All notifications marked as read" });
  } catch (ex) {
    next(ex);
  }
};

// Delete notification
module.exports.deleteNotification = async (req, res, next) => {
  try {
    const { notificationId, userId } = req.body;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.json({ msg: "Notification not found", status: false });
    }

    if (notification.recipient.toString() !== userId) {
      return res.json({ msg: "Unauthorized", status: false });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.json({ status: true, msg: "Notification deleted" });
  } catch (ex) {
    next(ex);
  }
};

// Get unread count
module.exports.getUnreadCount = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.json({ status: true, count });
  } catch (ex) {
    next(ex);
  }
};

