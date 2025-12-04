const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require("../controllers/notificationController");

const router = require("express").Router();

router.get("/:userId", getNotifications);
router.get("/unread/:userId", getUnreadCount);
router.post("/mark-read", markAsRead);
router.post("/mark-all-read", markAllAsRead);
router.post("/delete", deleteNotification);

module.exports = router;

