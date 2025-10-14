const Notification = require("../models/Notification");

// List my notifications
exports.listMyNotifications = async (req, res, next) => {
  try {
    const filter = { recipient: req.user._id };
    if (req.query.unread === "true") filter.read = false;

    const notes = await Notification.find(filter)
      .sort("-createdAt")
      .limit(50)
      .lean();

    res.json(notes);
  } catch (e) {
    next(e);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const note = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Not found" });
    res.json(note);
  } catch (e) {
    next(e);
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (e) {
    next(e);
  }
};
