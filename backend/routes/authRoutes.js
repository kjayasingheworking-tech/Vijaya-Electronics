const express = require("express");
const ctrl = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/register", ctrl.register); // optional
router.post("/login", ctrl.login);
router.get("/me", protect, ctrl.me);

// NEW: update profile and delete account
router.put("/me", protect, ctrl.updateMe);    // update name/email
router.delete("/me", protect, ctrl.deleteMe); // delete account
router.post("/logout", protect, ctrl.logout); // optional

module.exports = router;
