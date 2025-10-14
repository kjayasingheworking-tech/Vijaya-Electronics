const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const { requireFields } = require("../../middleware/validateMiddleware");
const ctrl = require("../../controllers/cm/feedbackController");

const router = express.Router();

router.get("/", ctrl.listFeedback);

router.use(protect);

router.post("/", requireFields("rating"), ctrl.createFeedback);
router.get("/:id", ctrl.getFeedback);
router.patch("/:id", ctrl.updateFeedback);
router.delete("/:id", ctrl.deleteFeedback);

// Comments
router.post("/:id/comments", requireFields("text"), ctrl.addComment);
router.patch("/:id/comments/:commentId", ctrl.updateComment);
router.delete("/:id/comments/:commentId", ctrl.deleteComment);

module.exports = router;
