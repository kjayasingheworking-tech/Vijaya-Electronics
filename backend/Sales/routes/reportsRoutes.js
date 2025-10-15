const express = require("express");
const {
  getDailyReport,
  getDateRangeReports,
  getMonthlyReports,
  getYearlyReports,
  getItemWiseReports,
  getDashboardReport
} = require("../controllers/reportsController.js");

const router = express.Router();

// Dashboard endpoint for overview
router.get("/dashboard", getDashboardReport);

// Daily Reports
router.get("/daily/:date", getDailyReport);

// Date Range Reports
router.get("/date-range", getDateRangeReports);

// Monthly Reports
router.get("/monthly/:year/:month", getMonthlyReports);

// Yearly Reports
router.get("/yearly/:year", getYearlyReports);

// Item-wise Reports
router.get("/item-wise", getItemWiseReports);

module.exports = router;
