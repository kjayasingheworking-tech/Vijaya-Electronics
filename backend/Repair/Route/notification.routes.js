const express = require("express");
const router = express.Router();
const Notification = require("../Model/notification.model");

//Get all notifications (latest first)
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

//Mark a notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const note = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Notification marked as read", note });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

//Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    const note = await Notification.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

module.exports = router;
