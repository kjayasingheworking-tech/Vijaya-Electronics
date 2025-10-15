const {
  getDailySalesSummary,
  getDateRangeReport,
  getMonthlyReport,
  getYearlyReport,
  getItemWiseReport
} = require("../services/reportsService.js");
const Invoice = require("../models/InvoiceModel.js");
const Discount = require("../models/DiscountModel.js");
const Customer = require("../models/CustomerModel.js");

// Daily Reports
const getDailyReport = async (req, res, next) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: "Date parameter is required (YYYY-MM-DD format)" 
      });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format. Use YYYY-MM-DD" 
      });
    }

    const report = await getDailySalesSummary(date);
    
    res.json({
      success: true,
      data: report,
      message: `Daily sales report generated for ${date}`
    });
  } catch (error) {
    console.error("Error in getDailyReport:", error);
    next(error);
  }
};

// Date Range Reports
const getDateRangeReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Both startDate and endDate are required (YYYY-MM-DD format)" 
      });
    }

    // Validate date formats
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format. Use YYYY-MM-DD" 
      });
    }

    if (startDateObj > endDateObj) {
      return res.status(400).json({ 
        success: false, 
        message: "Start date cannot be after end date" 
      });
    }

    const report = await getDateRangeReport(startDate, endDate);
    
    res.json({
      success: true,
      data: report,
      message: `Date range report generated from ${startDate} to ${endDate}`
    });
  } catch (error) {
    console.error("Error in getDateRangeReports:", error);
    next(error);
  }
};

// Monthly Reports
const getMonthlyReports = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false, 
        message: "Both year and month parameters are required" 
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid year or month. Month must be between 1-12" 
      });
    }

    const report = await getMonthlyReport(yearNum, monthNum);
    
    res.json({
      success: true,
      data: report,
      message: `Monthly report generated for ${year}-${month.toString().padStart(2, '0')}`
    });
  } catch (error) {
    console.error("Error in getMonthlyReports:", error);
    next(error);
  }
};

// Yearly Reports
const getYearlyReports = async (req, res, next) => {
  try {
    const { year } = req.params;
    
    if (!year) {
      return res.status(400).json({ 
        success: false, 
        message: "Year parameter is required" 
      });
    }

    const yearNum = parseInt(year);
    
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid year. Must be between 2000-2100" 
      });
    }

    const report = await getYearlyReport(yearNum);
    
    res.json({
      success: true,
      data: report,
      message: `Yearly report generated for ${year}`
    });
  } catch (error) {
    console.error("Error in getYearlyReports:", error);
    next(error);
  }
};

// Item-wise Reports
const getItemWiseReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Both startDate and endDate are required (YYYY-MM-DD format)" 
      });
    }

    // Validate date formats
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format. Use YYYY-MM-DD" 
      });
    }

    if (startDateObj > endDateObj) {
      return res.status(400).json({ 
        success: false, 
        message: "Start date cannot be after end date" 
      });
    }

    const report = await getItemWiseReport(startDate, endDate);
    
    res.json({
      success: true,
      data: report,
      message: `Item-wise report generated from ${startDate} to ${endDate}`
    });
  } catch (error) {
    console.error("Error in getItemWiseReports:", error);
    next(error);
  }
};


// Combined dashboard report
const getDashboardReport = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date();
    const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
    
    // Get today's summary
    const dailyReport = await getDailySalesSummary(today);
    
    // Get today's payment counts
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayInvoices = await Invoice.find({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });
    
    const todayPaidPayments = todayInvoices.filter(invoice => invoice.status === 'Paid').length;
    const todayPendingPayments = todayInvoices.filter(invoice => invoice.status === 'Pending').length;
    const todayUnpaidPayments = todayInvoices.filter(invoice => invoice.status === 'Unpaid').length;
    
    // Get this month's summary
    const monthlyReport = await getMonthlyReport(
      thisMonth.getFullYear(), 
      thisMonth.getMonth() + 1
    );
    
    // Get last month's summary for comparison
    const lastMonthReport = await getMonthlyReport(
      lastMonth.getFullYear(), 
      lastMonth.getMonth() + 1
    );

    // Calculate growth
    const monthlyGrowth = lastMonthReport.totalAmount > 0 
      ? ((monthlyReport.totalAmount - lastMonthReport.totalAmount) / lastMonthReport.totalAmount * 100)
      : 0;

    // Get additional dashboard data
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Total invoices (all time)
    const totalInvoices = await Invoice.countDocuments();
    
    // Total discounts (all time)
    const totalDiscounts = await Discount.countDocuments();
    
    // Payment counts for this month
    const monthlyInvoices = await Invoice.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const paidPayments = monthlyInvoices.filter(invoice => invoice.status === 'Paid').length;
    const pendingPayments = monthlyInvoices.filter(invoice => invoice.status === 'Pending').length;
    const unpaidPayments = monthlyInvoices.filter(invoice => invoice.status === 'Unpaid').length;
    
    // Total customers
    const totalCustomers = await Customer.countDocuments();

    const dashboardData = {
      today: {
        totalSalesAmount: dailyReport.totalSalesAmount,
        numberOfTransactions: dailyReport.numberOfTransactions,
        totalProductsSold: dailyReport.totalProductsSold,
        productsSold: dailyReport.productsSold,
        outstandingAmount: dailyReport.outstandingAmount,
        paidPayments: todayPaidPayments,
        pendingPayments: todayPendingPayments,
        unpaidPayments: todayUnpaidPayments
      },
      thisMonth: {
        totalAmount: monthlyReport.totalAmount,
        totalTransactions: monthlyReport.totalTransactions,
        totalProductsSold: monthlyReport.totalProductsSold,
        productsSold: monthlyReport.productsSold
      },
      summary: {
        totalRevenue: monthlyReport.totalAmount,
        totalTransactions: monthlyReport.totalTransactions,
        totalProductsSold: monthlyReport.totalProductsSold
      },
      counts: {
        totalInvoices,
        totalDiscounts,
        paidPayments,
        pendingPayments,
        unpaidPayments,
        totalCustomers
      }
    };

    res.json({
      success: true,
      data: dashboardData,
      message: "Dashboard report generated successfully"
    });
  } catch (error) {
    console.error("Error in getDashboardReport:", error);
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getDateRangeReports,
  getMonthlyReports,
  getYearlyReports,
  getItemWiseReports,
  getDashboardReport
};
