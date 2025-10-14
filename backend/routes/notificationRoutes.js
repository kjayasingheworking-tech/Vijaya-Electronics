const express = require("express");
const ctrl = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, ctrl.listMyNotifications);
router.patch("/me/:id/read", protect, ctrl.markAsRead);
router.patch("/me/read-all", protect, ctrl.markAllAsRead);

module.exports = router;

