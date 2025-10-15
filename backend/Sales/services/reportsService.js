const Invoice = require("../models/InvoiceModel.js");
const Product = require("../models/ProductModel.js");

// Helper function to calculate revenue from paid invoices only
function calculatePaidRevenue(invoices) {
  return invoices
    .filter(invoice => invoice.status === 'Paid')
    .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
}

// Helper function to get paid invoices only
function getPaidInvoices(invoices) {
  return invoices.filter(invoice => invoice.status === 'Paid');
}

// Daily Reports
async function getDailySalesSummary(date) {
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get all invoices for the day
    const invoices = await Invoice.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('customerId', 'name type');

    // Calculate total sales amount (only from paid invoices)
    const totalSalesAmount = calculatePaidRevenue(invoices);
    
    // Calculate number of transactions
    const numberOfTransactions = invoices.length;

    // Payment method breakdown (only from paid invoices)
    const paymentMethodBreakdown = {};
    const paidInvoices = getPaidInvoices(invoices);
    paidInvoices.forEach(invoice => {
      const method = invoice.paymentMethod || 'Unknown';
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + (invoice.totalAmount || 0);
    });

    // Ensure paymentMethodBreakdown is always an object
    const safePaymentMethodBreakdown = paymentMethodBreakdown && typeof paymentMethodBreakdown === 'object' 
      ? paymentMethodBreakdown 
      : {};

    // Outstanding amounts (pending invoices)
    const outstandingInvoices = invoices.filter(invoice => invoice.status === 'Pending');
    const outstandingAmount = outstandingInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

    // Item-wise summary (from ALL invoices - both paid and pending)
    const itemSummary = {};
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const key = item.name || 'Unknown Item';
        if (!itemSummary[key]) {
          itemSummary[key] = {
            quantity: 0,
            revenue: 0,
            unitPrice: item.unitPrice || 0,
            paidRevenue: 0,
            pendingRevenue: 0
          };
        }
        itemSummary[key].quantity += item.quantity || 0;
        itemSummary[key].revenue += item.total || 0;
        
        // Track paid vs pending revenue
        if (invoice.status === 'Paid') {
          itemSummary[key].paidRevenue += item.total || 0;
        } else if (invoice.status === 'Pending') {
          itemSummary[key].pendingRevenue += item.total || 0;
        }
      });
    });

    // Popular items ranking
    const popularItems = Object.entries(itemSummary)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
        unitPrice: data.unitPrice
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      date: date,
      totalSalesAmount,
      numberOfTransactions,
      totalProductsSold: Object.values(itemSummary).reduce((sum, item) => sum + item.quantity, 0),
      paymentMethodBreakdown: safePaymentMethodBreakdown,
      outstandingAmount,
      outstandingCount: outstandingInvoices.length,
      productsSold: Object.entries(itemSummary).map(([name, data]) => ({
        productName: name,
        quantitySold: data.quantity,
        totalRevenue: data.revenue,
        unitPrice: data.unitPrice,
        paidRevenue: data.paidRevenue,
        pendingRevenue: data.pendingRevenue,
        paymentStatus: data.pendingRevenue > 0 ? 'Mixed' : 'Paid'
      })),
      topSellingProducts: popularItems
    };
  } catch (error) {
    console.error("Error generating daily sales summary:", error);
    throw error;
  }
}

// Date-based filtered reports
async function getDateRangeReport(startDate, endDate) {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const invoices = await Invoice.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('customerId', 'name type');

    // Group by date for daily breakdown (only from paid invoices)
    const dailyBreakdown = {};
    const paidInvoices = getPaidInvoices(invoices);
    paidInvoices.forEach(invoice => {
      const date = invoice.createdAt.toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          totalAmount: 0,
          transactionCount: 0,
          items: {}
        };
      }
      dailyBreakdown[date].totalAmount += invoice.totalAmount || 0;
      dailyBreakdown[date].transactionCount += 1;

      // Item breakdown for the day
      invoice.items.forEach(item => {
        const itemName = item.name || 'Unknown';
        if (!dailyBreakdown[date].items[itemName]) {
          dailyBreakdown[date].items[itemName] = {
            quantity: 0,
            revenue: 0
          };
        }
        dailyBreakdown[date].items[itemName].quantity += item.quantity || 0;
        dailyBreakdown[date].items[itemName].revenue += item.total || 0;
      });
    });

    // Overall summary (only from paid invoices)
    const totalAmount = calculatePaidRevenue(invoices);
    const totalTransactions = paidInvoices.length;
    
    // Payment method summary (only from paid invoices)
    const paymentSummary = {};
    paidInvoices.forEach(invoice => {
      const method = invoice.paymentMethod || 'Unknown';
      if (!paymentSummary[method]) {
        paymentSummary[method] = { count: 0, amount: 0 };
      }
      paymentSummary[method].count += 1;
      paymentSummary[method].amount += invoice.totalAmount || 0;
    });

    // Get all products sold in the date range
    const allProductsSold = {};
    paidInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const productName = item.name || 'Unknown Product';
        if (!allProductsSold[productName]) {
          allProductsSold[productName] = {
            productName,
            quantitySold: 0,
            totalRevenue: 0,
            unitPrice: item.unitPrice || 0
          };
        }
        allProductsSold[productName].quantitySold += item.quantity || 0;
        allProductsSold[productName].totalRevenue += item.total || 0;
      });
    });

    // Calculate total products sold in date range (sum of all item quantities)
    const totalProductsSold = Object.values(allProductsSold).reduce((sum, product) => sum + product.quantitySold, 0);

    return {
      startDate,
      endDate,
      totalAmount,
      totalTransactions,
      totalProductsSold,
      productsSold: Object.values(allProductsSold).sort((a, b) => b.quantitySold - a.quantitySold),
      dailyBreakdown: Object.values(dailyBreakdown),
      paymentSummary
    };
  } catch (error) {
    console.error("Error generating date range report:", error);
    throw error;
  }
}

// Monthly reports
async function getMonthlyReport(year, month) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const invoices = await Invoice.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('customerId', 'name type');

    // Basic monthly stats (only from paid invoices)
    const totalAmount = calculatePaidRevenue(invoices);
    const paidInvoices = getPaidInvoices(invoices);
    const totalTransactions = paidInvoices.length;
    
    // Weekly breakdown within the month (only from paid invoices)
    const weeklyBreakdown = {};
    paidInvoices.forEach(invoice => {
      const weekStart = new Date(invoice.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyBreakdown[weekKey]) {
        weeklyBreakdown[weekKey] = {
          weekStart: weekKey,
          totalAmount: 0,
          transactionCount: 0
        };
      }
      weeklyBreakdown[weekKey].totalAmount += invoice.totalAmount || 0;
      weeklyBreakdown[weekKey].transactionCount += 1;
    });

    // Top selling days (only from paid invoices)
    const dailyStats = {};
    paidInvoices.forEach(invoice => {
      const day = invoice.createdAt.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = {
          date: day,
          totalAmount: 0,
          transactionCount: 0
        };
      }
      dailyStats[day].totalAmount += invoice.totalAmount || 0;
      dailyStats[day].transactionCount += 1;
    });

    const topDays = Object.values(dailyStats)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Payment method analysis (only from paid invoices)
    const paymentSummary = {};
    paidInvoices.forEach(invoice => {
      const method = invoice.paymentMethod || 'Unknown';
      if (!paymentSummary[method]) {
        paymentSummary[method] = { count: 0, amount: 0 };
      }
      paymentSummary[method].count += 1;
      paymentSummary[method].amount += invoice.totalAmount || 0;
    });

    // Customer type analysis (only from paid invoices)
    const customerTypeAnalysis = {};
    paidInvoices.forEach(invoice => {
      if (invoice.customerId) {
        const type = invoice.customerId.type || 'Unknown';
        if (!customerTypeAnalysis[type]) {
          customerTypeAnalysis[type] = { count: 0, amount: 0 };
        }
        customerTypeAnalysis[type].count += 1;
        customerTypeAnalysis[type].amount += invoice.totalAmount || 0;
      }
    });

    // Get all products sold in the month
    const allProductsSold = {};
    paidInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const productName = item.name || 'Unknown Product';
        if (!allProductsSold[productName]) {
          allProductsSold[productName] = {
            productName,
            quantitySold: 0,
            totalRevenue: 0,
            unitPrice: item.unitPrice || 0
          };
        }
        allProductsSold[productName].quantitySold += item.quantity || 0;
        allProductsSold[productName].totalRevenue += item.total || 0;
      });
    });

    // Calculate total products sold (sum of all item quantities)
    const totalProductsSold = Object.values(allProductsSold).reduce((sum, product) => sum + product.quantitySold, 0);

    return {
      year,
      month,
      period: `${year}-${month.toString().padStart(2, '0')}`,
      totalAmount,
      totalTransactions,
      totalProductsSold,
      productsSold: Object.values(allProductsSold).sort((a, b) => b.quantitySold - a.quantitySold),
      paymentSummary,
      dailyBreakdown: Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date))
    };
  } catch (error) {
    console.error("Error generating monthly report:", error);
    throw error;
  }
}

// Yearly reports
async function getYearlyReport(year) {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const invoices = await Invoice.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('customerId', 'name type');

    // Basic yearly stats (only from paid invoices)
    const totalAmount = calculatePaidRevenue(invoices);
    const paidInvoices = getPaidInvoices(invoices);
    const totalTransactions = paidInvoices.length;
    
    // Monthly breakdown (only from paid invoices)
    const monthlyBreakdown = {};
    paidInvoices.forEach(invoice => {
      const month = invoice.createdAt.getMonth() + 1; // 1-12
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = {
          month,
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
          totalAmount: 0,
          transactionCount: 0
        };
      }
      monthlyBreakdown[month].totalAmount += invoice.totalAmount || 0;
      monthlyBreakdown[month].transactionCount += 1;
    });

    // Quarterly breakdown
    const quarterlyBreakdown = {
      Q1: { quarter: 'Q1', months: 'Jan-Mar', totalAmount: 0, transactionCount: 0 },
      Q2: { quarter: 'Q2', months: 'Apr-Jun', totalAmount: 0, transactionCount: 0 },
      Q3: { quarter: 'Q3', months: 'Jul-Sep', totalAmount: 0, transactionCount: 0 },
      Q4: { quarter: 'Q4', months: 'Oct-Dec', totalAmount: 0, transactionCount: 0 }
    };

    paidInvoices.forEach(invoice => {
      const month = invoice.createdAt.getMonth() + 1;
      let quarter;
      if (month <= 3) quarter = 'Q1';
      else if (month <= 6) quarter = 'Q2';
      else if (month <= 9) quarter = 'Q3';
      else quarter = 'Q4';
      
      quarterlyBreakdown[quarter].totalAmount += invoice.totalAmount || 0;
      quarterlyBreakdown[quarter].transactionCount += 1;
    });

    // Top performing months
    const topMonths = Object.values(monthlyBreakdown)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 6);

    // Payment method trends (only from paid invoices)
    const paymentSummary = {};
    paidInvoices.forEach(invoice => {
      const method = invoice.paymentMethod || 'Unknown';
      if (!paymentSummary[method]) {
        paymentSummary[method] = { count: 0, amount: 0 };
      }
      paymentSummary[method].count += 1;
      paymentSummary[method].amount += invoice.totalAmount || 0;
    });

    // Customer type analysis (only from paid invoices)
    const customerTypeAnalysis = {};
    paidInvoices.forEach(invoice => {
      if (invoice.customerId) {
        const type = invoice.customerId.type || 'Unknown';
        if (!customerTypeAnalysis[type]) {
          customerTypeAnalysis[type] = { count: 0, amount: 0 };
        }
        customerTypeAnalysis[type].count += 1;
        customerTypeAnalysis[type].amount += invoice.totalAmount || 0;
      }
    });

    // Growth calculation (compare with previous year)
    const previousYearStart = new Date(year - 1, 0, 1);
    const previousYearEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999);
    const previousYearInvoices = await Invoice.find({
      createdAt: { $gte: previousYearStart, $lte: previousYearEnd }
    });
    const previousYearAmount = calculatePaidRevenue(previousYearInvoices);
    const growthRate = previousYearAmount > 0 ? ((totalAmount - previousYearAmount) / previousYearAmount * 100) : 0;

    // Get all products sold in the year
    const allProductsSold = {};
    paidInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const productName = item.name || 'Unknown Product';
        if (!allProductsSold[productName]) {
          allProductsSold[productName] = {
            productName,
            quantitySold: 0,
            totalRevenue: 0,
            unitPrice: item.unitPrice || 0
          };
        }
        allProductsSold[productName].quantitySold += item.quantity || 0;
        allProductsSold[productName].totalRevenue += item.total || 0;
      });
    });

    // Calculate total products sold in the year (sum of all item quantities)
    const totalProductsSold = Object.values(allProductsSold).reduce((sum, product) => sum + product.quantitySold, 0);

    return {
      year,
      totalAmount,
      totalTransactions,
      totalProductsSold,
      productsSold: Object.values(allProductsSold).sort((a, b) => b.quantitySold - a.quantitySold),
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => a.month - b.month),
      quarterlyBreakdown: Object.values(quarterlyBreakdown),
      paymentSummary
    };
  } catch (error) {
    console.error("Error generating yearly report:", error);
    throw error;
  }
}

// Item-wise reports
async function getItemWiseReport(startDate, endDate) {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const invoices = await Invoice.find({
      createdAt: { $gte: start, $lte: end }
    });

    // Product performance analysis
    const productPerformance = {};
    const paidInvoices = getPaidInvoices(invoices);
    paidInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const productName = item.name || 'Unknown Product';
        if (!productPerformance[productName]) {
          productPerformance[productName] = {
            name: productName,
            totalQuantity: 0,
            totalRevenue: 0,
            averagePrice: 0,
            transactionCount: 0,
            unitPrice: item.unitPrice || 0
          };
        }
        productPerformance[productName].totalQuantity += item.quantity || 0;
        productPerformance[productName].totalRevenue += item.total || 0;
        productPerformance[productName].transactionCount += 1;
        productPerformance[productName].averagePrice = 
          productPerformance[productName].totalRevenue / productPerformance[productName].totalQuantity;
      });
    });

    // Sort by revenue for performance ranking
    const performanceRanking = Object.values(productPerformance)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Category-wise analysis (assuming products have categories)
    const categories = await Product.find({}).select('productName category');
    const categoryMap = {};
    categories.forEach(product => {
      categoryMap[product.productName] = product.category;
    });

    const categoryAnalysis = {};
    Object.values(productPerformance).forEach(product => {
      const category = categoryMap[product.name] || 'Uncategorized';
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          name: category,
          totalRevenue: 0,
          totalQuantity: 0,
          productCount: 0
        };
      }
      categoryAnalysis[category].totalRevenue += product.totalRevenue;
      categoryAnalysis[category].totalQuantity += product.totalQuantity;
      categoryAnalysis[category].productCount += 1;
    });

    return {
      startDate,
      endDate,
      productPerformance: performanceRanking,
      categoryAnalysis: Object.values(categoryAnalysis),
      totalProducts: Object.keys(productPerformance).length
    };
  } catch (error) {
    console.error("Error generating item-wise report:", error);
    throw error;
  }
}


module.exports = {
  getDailySalesSummary,
  getDateRangeReport,
  getMonthlyReport,
  getYearlyReport,
  getItemWiseReport
};
