const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const ctrl = require("../../controllers/cm/ticketController");
const upload = require("../../middleware/upload");


const router = express.Router();

// Allow multiple photo uploads for complaints
router.post("/", protect, upload.array("photos", 5), ctrl.createTicket);

router.get("/", protect, ctrl.listTickets);
router.get("/:id", protect, ctrl.getTicket);
router.post("/:id/replies", protect, ctrl.addReply);
router.patch("/:id/status", protect, ctrl.updateStatus);
router.get("/:id/messages", protect, ctrl.getMessages);
router.delete("/:id", protect, ctrl.deleteTicket);

module.exports = router;
