import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import "../../styles/sales.css";
import { API, API_ENDPOINTS } from '../../constants/salesApi';

// Utility functions
const getCommonTableStyles = () => ({
  fontSize: 8,
  cellPadding: 2,
  lineColor: [200, 200, 200],
  lineWidth: 0.1,
  halign: 'left'
});

const getCommonTableHeadStyles = () => ({
  fillColor: [240, 240, 240],
  textColor: [0, 0, 0],
  fontSize: 8,
  fontStyle: 'bold',
  halign: 'left'
});

const getCommonTableBodyStyles = () => ({
  fontSize: 8,
  cellPadding: 2,
  halign: 'left'
});

const createTable = (doc, head, body, startY, margin) => {
  autoTable(doc, {
    head: [head],
    body: body,
    startY: startY,
    margin: { left: margin, right: margin },
    styles: getCommonTableStyles(),
    headStyles: getCommonTableHeadStyles(),
    bodyStyles: getCommonTableBodyStyles()
  });
  return doc.lastAutoTable.finalY + 10;
};

const formatCurrency = (amount) => `Rs. ${amount || 0}`;

const formatDate = (date) => new Date(date).toLocaleDateString();

const getEmptyState = (colspan, message) => (
  <tr>
    <td colSpan={colspan} className="px-4 py-8 text-center text-gray-500">
      {message}
    </td>
  </tr>
);

const SalesReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('dashboard');
  const [reportData, setReportData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const selectedProductRef = useRef('');
  const [dashboardSubType, setDashboardSubType] = useState('daily'); // 'daily' or 'monthly'
  
  // Date-related states
  const [dates, setDates] = useState({
    selectedDate: format(new Date(), 'yyyy-MM-dd'),
    dateRange: {
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    },
    selectedMonth: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    },
    selectedYear: new Date().getFullYear()
  });


  // Build URL for different report types
  const buildReportURL = useCallback(() => {
    const { selectedDate, dateRange, selectedMonth, selectedYear } = dates;
    
    switch (reportType) {
      case 'dashboard':
        return `${API}${API_ENDPOINTS.REPORTS_DASHBOARD}`;
      case 'daily':
        return `${API}${API_ENDPOINTS.REPORTS_DAILY(selectedDate)}`;
      case 'dateRange':
        return `${API}${API_ENDPOINTS.REPORTS_DATE_RANGE}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      case 'monthly':
        return `${API}${API_ENDPOINTS.REPORTS_MONTHLY(selectedMonth.year, selectedMonth.month)}`;
      case 'yearly':
        return `${API}${API_ENDPOINTS.REPORTS_YEARLY(selectedYear)}`;
      case 'itemWise':
        return `${API}${API_ENDPOINTS.REPORTS_ITEM_WISE}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      default:
        return `${API}${API_ENDPOINTS.REPORTS_DASHBOARD}`;
    }
  }, [reportType, dates]);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const url = buildReportURL();
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [buildReportURL]);


  // Helper function to get date info for PDF
  const getDateInfo = useCallback(() => {
    switch (reportType) {
      case 'daily':
        return `Date: ${dates.selectedDate}`;
      case 'dateRange':
        return `From: ${dates.dateRange.startDate} To: ${dates.dateRange.endDate}`;
      case 'monthly':
        return `Month: ${dates.selectedMonth.year}-${dates.selectedMonth.month.toString().padStart(2, '0')}`;
      case 'yearly':
        return `Year: ${dates.selectedYear}`;
      default:
        return `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
    }
  }, [reportType, dates]);

  // Helper function to add PDF header
  const addPDFHeader = useCallback((doc) => {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Sales Report', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 20, 45);
    doc.text(getDateInfo(), 20, 55);
  }, [reportType, getDateInfo]);

  const exportToPDF = useCallback(() => {
    if (!reportData) return;

    const doc = new jsPDF();
    const margin = 20;
    addPDFHeader(doc);

    let yPosition = 70;

    // Dashboard report
    if (reportType === 'dashboard' && reportData) {
      if (dashboardSubType === 'daily') {
        // Daily Summary PDF
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Summary Report', margin, yPosition);
        yPosition += 20;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Today\'s Performance', margin, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Sales: ${formatCurrency(reportData.today?.totalSalesAmount)}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Transactions: ${reportData.today?.numberOfTransactions || 0}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Outstanding: ${formatCurrency(reportData.today?.outstandingAmount)}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Products Sold: ${reportData.today?.totalProductsSold || 0}`, margin, yPosition);
        yPosition += 20;

        // System Overview
        if (reportData.counts) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('System Overview', margin, yPosition);
          yPosition += 15;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Total Invoices: ${reportData.counts.totalInvoices || 0}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Total Discounts: ${reportData.counts.totalDiscounts || 0}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Total Customers: ${reportData.counts.totalCustomers || 0}`, margin, yPosition);
          yPosition += 20;

          // Payment Status for Today
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Payment Status (Today)', margin, yPosition);
          yPosition += 15;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Paid Payments: ${reportData.today?.paidPayments || 0}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Pending Payments: ${reportData.today?.pendingPayments || 0}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Unpaid Payments: ${reportData.today?.unpaidPayments || 0}`, margin, yPosition);
          yPosition += 10;
        }
      } else if (dashboardSubType === 'monthly') {
        // Monthly Summary PDF
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Summary Report', margin, yPosition);
        yPosition += 20;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('This Month\'s Performance', margin, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Revenue: ${formatCurrency(reportData.thisMonth?.totalAmount)}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Total Transactions: ${reportData.thisMonth?.totalTransactions || 0}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Total Products Sold: ${reportData.thisMonth?.totalProductsSold || 0}`, margin, yPosition);
        yPosition += 10;
        doc.text(`Outstanding Amount: ${formatCurrency(reportData.today?.outstandingAmount)}`, margin, yPosition);
        yPosition += 20;

        // System Overview
        if (reportData.counts) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('System Overview', margin, yPosition);
          yPosition += 15;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Total Invoices: ${reportData.counts.totalInvoices || 0}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Total Discounts: ${reportData.counts.totalDiscounts || 0}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Total Customers: ${reportData.counts.totalCustomers || 0}`, margin, yPosition);
          yPosition += 20;

          // Payment Status for This Month
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Payment Status (This Month)', margin, yPosition);
          yPosition += 15;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Paid Payments: ${reportData.counts.paidPayments || 0}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Pending Payments: ${reportData.counts.pendingPayments || 0}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Unpaid Payments: ${reportData.counts.unpaidPayments || 0}`, margin, yPosition);
          yPosition += 10;
        }
      }
    }

    // Daily report
    if (reportType === 'daily' && reportData) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Daily Sales Summary', margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Sales Amount: ${formatCurrency(reportData.totalSalesAmount)}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Number of Transactions: ${reportData.numberOfTransactions}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Products Sold: ${reportData.totalProductsSold || 0}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Outstanding Amount: ${formatCurrency(reportData.outstandingAmount)}`, margin, yPosition);
      yPosition += 20;

      // Products Sold Table
      if (reportData.productsSold && reportData.productsSold.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Products Sold Today', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.productsSold.map(product => [
          product.productName,
          product.quantitySold.toString(),
          `Rs. ${product.unitPrice}`,
          `Rs. ${product.paidRevenue || 0}`,
          `Rs. ${product.pendingRevenue || 0}`
        ]);

        yPosition = createTable(doc, 
          ['Product Name', 'Quantity Sold', 'Unit Price', 'Paid Revenue', 'Pending Revenue'],
          tableData,
          yPosition,
          margin
        );
      }

      // Payment method breakdown
      if (reportData.paymentMethodBreakdown && Object.keys(reportData.paymentMethodBreakdown).length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Method Breakdown', margin, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.entries(reportData.paymentMethodBreakdown).forEach(([method, amount]) => {
          doc.text(`${method}: Rs. ${amount}`, margin + 10, yPosition);
          yPosition += 10;
        });
        yPosition += 10;
      }

      // Popular items
      if (reportData.popularItems && reportData.popularItems.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Popular Items', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.popularItems.map(item => [
          item.name,
          item.quantity.toString(),
          `Rs. ${item.revenue}`
        ]);

        yPosition = createTable(doc, 
          ['Item Name', 'Quantity', 'Revenue'],
          tableData,
          yPosition,
          margin
        );
      }
    }

    // Date range report
    if (reportType === 'dateRange' && reportData) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Date Range Summary', margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Amount: Rs. ${reportData.totalAmount}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Transactions: ${reportData.totalTransactions}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Products Sold: ${reportData.totalProductsSold || 0}`, margin, yPosition);
      yPosition += 20;

      // Products Sold Table
      if (reportData.productsSold && reportData.productsSold.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Products Sold in Date Range', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.productsSold.map(product => [
          product.productName,
          product.quantitySold.toString(),
          `Rs. ${product.unitPrice}`,
          `Rs. ${product.totalRevenue}`
        ]);

        autoTable(doc, {
          head: [['Product Name', 'Quantity Sold', 'Unit Price', 'Total Revenue']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Daily breakdown table
      if (reportData.dailyBreakdown && reportData.dailyBreakdown.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Breakdown', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.dailyBreakdown.map(day => [
          day.date,
          `Rs. ${day.totalAmount}`,
          day.transactionCount.toString()
        ]);

        autoTable(doc, {
          head: [['Date', 'Amount', 'Transactions']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }
    }

    // Monthly report
    if (reportType === 'monthly' && reportData) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Report', margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${reportData.period}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Revenue: Rs. ${reportData.totalAmount}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Transactions: ${reportData.totalTransactions}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Products Sold: ${reportData.totalProductsSold || 0}`, margin, yPosition);
      yPosition += 20;

      // Products Sold Table
      if (reportData.productsSold && reportData.productsSold.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Products Sold This Month', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.productsSold.map(product => [
          product.productName,
          product.quantitySold.toString(),
          `Rs. ${product.unitPrice}`,
          `Rs. ${product.totalRevenue}`
        ]);

        autoTable(doc, {
          head: [['Product Name', 'Quantity Sold', 'Unit Price', 'Total Revenue']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Weekly breakdown table
      if (reportData.weeklyBreakdown && reportData.weeklyBreakdown.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Weekly Performance', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.weeklyBreakdown.map(week => [
          new Date(week.weekStart).toLocaleDateString(),
          `Rs. ${week.totalAmount}`,
          week.transactionCount.toString(),
          `Rs. ${week.totalAmount}`
        ]);

        autoTable(doc, {
          head: [['Week Starting', 'Revenue', 'Transactions', 'Avg per Transaction']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Top selling days
      if (reportData.topDays && reportData.topDays.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Selling Days', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.topDays.slice(0, 10).map(day => [
          new Date(day.date).toLocaleDateString(),
          `Rs. ${day.totalAmount}`,
          day.transactionCount.toString()
        ]);

        autoTable(doc, {
          head: [['Date', 'Revenue', 'Transactions']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Payment Method Analysis
      if (reportData.paymentSummary && Object.keys(reportData.paymentSummary).length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Method Analysis', margin, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.entries(reportData.paymentSummary).forEach(([method, data]) => {
          doc.text(`${method}: ${formatCurrency(data.amount)} (${data.count} transactions)`, margin, yPosition);
          yPosition += 10;
        });
        yPosition += 10;
      }
    }

    // Yearly report
    if (reportType === 'yearly' && reportData) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Annual Report', margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Year: ${reportData.year}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Revenue: Rs. ${reportData.totalAmount}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Transactions: ${reportData.totalTransactions}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Products Sold: ${reportData.totalProductsSold || 0}`, margin, yPosition);
      yPosition += 10;
      yPosition += 20;

      // Products Sold Table
      if (reportData.productsSold && reportData.productsSold.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Products Sold This Year', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.productsSold.map(product => [
          product.productName,
          product.quantitySold.toString(),
          `Rs. ${product.unitPrice}`,
          `Rs. ${product.totalRevenue}`
        ]);

        autoTable(doc, {
          head: [['Product Name', 'Quantity Sold', 'Unit Price', 'Total Revenue']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Quarterly breakdown table
      if (reportData.quarterlyBreakdown && reportData.quarterlyBreakdown.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Quarterly Performance', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.quarterlyBreakdown.map(quarter => [
          quarter.quarter,
          quarter.months,
          `Rs. ${quarter.totalAmount}`,
          quarter.transactionCount.toString()
        ]);

        autoTable(doc, {
          head: [['Quarter', 'Months', 'Revenue', 'Transactions']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Monthly breakdown table
      if (reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Breakdown', margin, yPosition);
        yPosition += 15;

        const tableData = reportData.monthlyBreakdown.map(month => [
          month.monthName,
          `Rs. ${month.totalAmount}`,
          month.transactionCount.toString(),
          `Rs. ${month.totalAmount}`
        ]);

        autoTable(doc, {
          head: [['Month', 'Revenue', 'Transactions', 'Avg per Transaction']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Year-over-year comparison
      if (reportData.previousYearComparison) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Year-over-Year Comparison', margin, yPosition);
        yPosition += 15;

        const tableData = [
          [reportData.year.toString(), `Rs. ${reportData.totalAmount}`, reportData.totalTransactions.toString()],
          ['Total Products Sold', reportData.totalProductsSold.toString(), '-']
        ];

        autoTable(doc, {
          head: [['Year', 'Revenue', 'Transactions']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
      }
    }

    // Item-wise report
    if (reportType === 'itemWise' && reportData) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Item-wise Analysis', margin, yPosition);
      yPosition += 15;

      // Add date range information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateInfo = getDateInfo();
      doc.text(`Report Period: ${dateInfo}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Total Products: ${reportData.totalProducts}`, margin, yPosition);
      
      // Add filter information if a product is selected
      if (selectedProductRef.current) {
        yPosition += 10;
        doc.setFont('helvetica', 'bold');
        doc.text(`Filter Applied: ${selectedProductRef.current}`, margin, yPosition);
        doc.setFont('helvetica', 'normal');
      }
      
      yPosition += 20;

      // Product performance table
      if (reportData.productPerformance && reportData.productPerformance.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        
        // Apply the same filter as the frontend
        const filteredProducts = reportData.productPerformance.filter(product => 
          !selectedProductRef.current || product.name === selectedProductRef.current
        );
        
        if (selectedProductRef.current) {
          doc.text(`Product Performance - ${selectedProductRef.current}`, margin, yPosition);
        } else {
          doc.text('Product Performance - All Products', margin, yPosition);
        }
        yPosition += 15;

        const tableData = filteredProducts.slice(0, 20).map(product => [
          product.name,
          product.totalQuantity.toString(),
          `Rs. ${product.totalRevenue}`,
          product.transactionCount.toString()
        ]);

        autoTable(doc, {
          head: [['Product', 'Quantity', 'Revenue', 'Transactions']],
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left'
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
          }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

    }


    // Save the PDF
    const fileName = `sales-report-${reportType}-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`;
    doc.save(fileName);
  }, [reportData, reportType, dates, addPDFHeader, dashboardSubType]);


  // Auto-fetch when report type or dates change
  useEffect(() => {
    if (reportType) {
      fetchReport();
    }
  }, [reportType, dates, fetchReport]);

  // Restore selectedProduct when switching to itemWise report
  useEffect(() => {
    if (reportType === 'itemWise' && selectedProductRef.current) {
      setSelectedProduct(selectedProductRef.current);
    }
  }, [reportType]);


  // Render dashboard report
  const renderDashboard = useCallback(() => (
    <div className="section-spacing">
      {/* Dashboard Sub-type Selection */}
      <div className="card">
        <h3 className="card-header">Dashboard Report Options</h3>
        <div className="responsive-grid">
          <button
            onClick={() => setDashboardSubType('daily')}
            className={`btn-report ${dashboardSubType === 'daily' ? 'btn-report-active' : 'btn-report-inactive'}`}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setDashboardSubType('monthly')}
            className={`btn-report ${dashboardSubType === 'monthly' ? 'btn-report-active' : 'btn-report-inactive'}`}
          >
            Monthly Summary
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-header">Today's Summary</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-value stat-blue">Rs. {reportData.today?.totalSalesAmount || 0}</p>
            <p className="stat-label">Total Sales</p>
          </div>
          <div className="stat-card">
            <p className="stat-value stat-green">{reportData.today?.numberOfTransactions || 0}</p>
            <p className="stat-label">Transactions</p>
          </div>
          <div className="stat-card">
            <p className="stat-value stat-red">Rs. {reportData.today?.outstandingAmount || 0}</p>
            <p className="stat-label">Outstanding</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-header">This Month's Summary</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-value stat-blue">Rs. {reportData.thisMonth?.totalAmount || 0}</p>
            <p className="stat-label">Total Revenue</p>
          </div>
          <div className="stat-card">
            <p className="stat-value stat-green">{reportData.thisMonth?.totalTransactions || 0}</p>
            <p className="stat-label">Transactions</p>
          </div>
          <div className="stat-card">
            <p className="stat-value stat-purple">{reportData.thisMonth?.totalProductsSold || 0}</p>
            <p className="stat-label">Products Sold</p>
          </div>
          <div className="stat-card">
            <p className="stat-value stat-orange">Rs. {reportData.today?.outstandingAmount || 0}</p>
            <p className="stat-label">Outstanding</p>
          </div>
        </div>
      </div>
    </div>
  ), [reportData, dashboardSubType]);

  // Render daily report
  const renderDaily = useCallback(() => (
    <div className="section-spacing">
      <div className="card">
        <h3 className="card-header">Daily Sales Report - {dates.selectedDate}</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-value stat-blue">Rs. {reportData.totalSalesAmount || 0}</p>
            <p className="stat-label">Total Sales</p>
          </div>
          <div className="stat-card">
            <p className="stat-value stat-green">{reportData.numberOfTransactions || 0}</p>
            <p className="stat-label">Transactions</p>
          </div>
          <div className="stat-card">
            <p className="stat-value stat-red">Rs. {reportData.outstandingAmount || 0}</p>
            <p className="stat-label">Outstanding</p>
          </div>
        </div>
      </div>
    </div>
  ), [reportData, dates]);

  const renderReportContent = useCallback(() => {
    if (!reportData) return <div className="status-message">No data available</div>;
    
    // Ensure the required data structure
    if (typeof reportData !== 'object') return <div className="status-message">Invalid data format</div>;

    switch (reportType) {
      case 'dashboard':
        return renderDashboard();

      case 'daily':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                Daily Report - {dates.selectedDate}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">Rs. {reportData.totalSalesAmount || 0}</p>
                  <p className="text-sm text-gray-600">Total Sales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{reportData.numberOfTransactions || 0}</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{reportData.totalProductsSold || 0}</p>
                  <p className="text-sm text-gray-600">Products Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">Rs. {reportData.outstandingAmount || 0}</p>
                  <p className="text-sm text-gray-600">Outstanding</p>
                </div>
              </div>

              {/* Products Sold Table */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Products Sold Today</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Revenue</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.productsSold && reportData.productsSold.length > 0 ? (
                        reportData.productsSold.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.productName}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.quantitySold}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.unitPrice}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.paidRevenue || 0}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.pendingRevenue || 0}</td>
                          </tr>
                        ))
                      ) : (
                        getEmptyState(5, "No products sold today")
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Top Selling Products</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.topSellingProducts && reportData.topSellingProducts.length > 0 ? (
                    reportData.topSellingProducts.slice(0, 6).map((product, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-lg">{product.name}</h5>
                        <p className="text-2xl font-bold text-blue-600">{product.quantity} units</p>
                        <p className="text-sm text-gray-600">Rs. {product.revenue} revenue</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No top selling products data available
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Payment Methods</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {reportData.paymentMethodBreakdown && Object.keys(reportData.paymentMethodBreakdown).length > 0 ? (
                    Object.entries(reportData.paymentMethodBreakdown).map(([method, amount], index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">Rs. {amount}</p>
                        <p className="text-sm text-gray-600">{method}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No payment method data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );


      case 'dateRange':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                Date Range Report ({dates.dateRange.startDate} to {dates.dateRange.endDate})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">Rs. {reportData.totalAmount}</p>
                  <p className="text-sm text-gray-600">Total Amount</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{reportData.totalTransactions}</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{reportData.totalProductsSold || 0}</p>
                  <p className="text-sm text-gray-600">Products Sold</p>
                </div>
              </div>

              {/* Products Sold Table */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Products Sold in Date Range</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.productsSold && reportData.productsSold.length > 0 ? (
                        reportData.productsSold.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.productName}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.quantitySold}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.unitPrice}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.totalRevenue}</td>
                          </tr>
                        ))
                      ) : (
                        getEmptyState(4, "No products sold in this date range")
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Daily Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.dailyBreakdown && reportData.dailyBreakdown.length > 0 ? (
                        reportData.dailyBreakdown.map((day, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {day.totalAmount}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{day.transactionCount}</td>
                          </tr>
                        ))
                      ) : (
                        getEmptyState(3, "No daily breakdown data available")
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'monthly':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                Monthly Report - {new Date(dates.selectedMonth.year, dates.selectedMonth.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">Rs. {reportData.totalAmount || 0}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{reportData.totalTransactions || 0}</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{reportData.totalProductsSold || 0}</p>
                  <p className="text-sm text-gray-600">Products Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{reportData.weeklyBreakdown?.length || 0}</p>
                  <p className="text-sm text-gray-600">Active Weeks</p>
                </div>
              </div>

              {/* Products Sold Table */}
              {reportData.productsSold && reportData.productsSold.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Products Sold This Month</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.productsSold.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.productName}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.quantitySold}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.unitPrice}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.totalRevenue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Weekly Breakdown */}
              {reportData.weeklyBreakdown && reportData.weeklyBreakdown.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Weekly Performance</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Week Starting</th>
                          <th className="px-4 py-2 text-left">Revenue</th>
                          <th className="px-4 py-2 text-left">Transactions</th>
                          <th className="px-4 py-2 text-left">Avg per Transaction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.weeklyBreakdown.map((week, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{new Date(week.weekStart).toLocaleDateString()}</td>
                            <td className="px-4 py-2">Rs. {week.totalAmount}</td>
                            <td className="px-4 py-2">{week.transactionCount}</td>
                            <td className="px-4 py-2">Rs. {week.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Selling Days */}
              {reportData.topDays && reportData.topDays.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Top Selling Days</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Revenue</th>
                          <th className="px-4 py-2 text-left">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.topDays.map((day, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{new Date(day.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2">Rs. {day.totalAmount}</td>
                            <td className="px-4 py-2">{day.transactionCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              {reportData.paymentSummary && Object.keys(reportData.paymentSummary).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Payment Method Analysis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(reportData.paymentSummary).map(([method, data]) => (
                      <div key={method} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">{method}</p>
                        <p className="text-blue-600">Rs. {data.amount}</p>
                        <p className="text-sm text-gray-600">{data.count} transactions</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'yearly':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Annual Report - {dates.selectedYear}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">Rs. {reportData.totalAmount || 0}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{reportData.totalTransactions || 0}</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{reportData.totalProductsSold || 0}</p>
                  <p className="text-sm text-gray-600">Products Sold</p>
                </div>
              </div>

              {/* Products Sold Table */}
              {reportData.productsSold && reportData.productsSold.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Products Sold This Year</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.productsSold.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.productName}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.quantitySold}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.unitPrice}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Rs. {product.totalRevenue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quarterly Breakdown */}
              {reportData.quarterlyBreakdown && reportData.quarterlyBreakdown.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Quarterly Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {reportData.quarterlyBreakdown.map((quarter, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-lg">{quarter.quarter}</h5>
                        <p className="text-sm text-gray-600 mb-2">{quarter.months}</p>
                        <p className="text-xl font-bold text-blue-600">Rs. {quarter.totalAmount}</p>
                        <p className="text-sm text-gray-600">{quarter.transactionCount} transactions</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Breakdown */}
              {reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Monthly Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Month</th>
                          <th className="px-4 py-2 text-left">Revenue</th>
                          <th className="px-4 py-2 text-left">Transactions</th>
                          <th className="px-4 py-2 text-left">Products Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.monthlyBreakdown.map((month, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{month.monthName}</td>
                            <td className="px-4 py-2">Rs. {month.totalAmount}</td>
                            <td className="px-4 py-2">{month.transactionCount}</td>
                            <td className="px-4 py-2">{month.productsSold || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Performing Months */}
              {reportData.topMonths && reportData.topMonths.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Top Performing Months</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {reportData.topMonths.map((month, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">{month.monthName}</p>
                        <p className="text-blue-600">Rs. {month.totalAmount}</p>
                        <p className="text-sm text-gray-600">{month.transactionCount} transactions</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Sold Summary */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Products Sold Summary</h4>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-2xl font-bold text-green-600">{reportData.totalProductsSold || 0}</p>
                  <p className="text-sm text-gray-600">Total Products Sold This Year</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'itemWise':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Item-wise Analysis</h3>
              
              {/* Product Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Product:
                </label>
                <select
                  key={`product-filter-${selectedProduct}-${reportData?.productPerformance?.length || 0}`}
                  value={selectedProductRef.current || selectedProduct}
                  onChange={(e) => {
                    const value = e.target.value;
                    selectedProductRef.current = value;
                    setSelectedProduct(value);
                  }}
                  className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Products</option>
                  {reportData && reportData.productPerformance && reportData.productPerformance.map((product, index) => (
                    <option key={index} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <p className="text-gray-600">
                  Total Products: <span className="font-semibold">{reportData.totalProducts}</span>
                </p>
                {selectedProductRef.current && (
                  <p className="text-blue-600 text-sm mt-2">
                    Showing results for: <span className="font-semibold">{selectedProductRef.current}</span>
                  </p>
                )}
              </div>


              {/* Product Performance */}
              {reportData.productPerformance && reportData.productPerformance.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Product Performance</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Quantity</th>
                          <th className="px-4 py-2 text-left">Revenue</th>
                          <th className="px-4 py-2 text-left">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.productPerformance
                          .filter(product => !selectedProductRef.current || product.name === selectedProductRef.current)
                          .slice(0, 20).map((product, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{product.name}</td>
                            <td className="px-4 py-2">{product.totalQuantity}</td>
                            <td className="px-4 py-2">Rs. {product.totalRevenue}</td>
                            <td className="px-4 py-2">{product.transactionCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        );


      default:
        return <div className="status-message">Select a report type to view data</div>;
    }
  }, [reportData, reportType, dates, renderDashboard, renderDaily]);

  return (
    <div className="page-container">
      <div className="flex-between mb-6">
        <h1 className="text-2xl text-bold text-gray-800">Sales Reports</h1>
        <button
          onClick={exportToPDF}
          disabled={!reportData}
          className="btn-export"
        >
          Export PDF
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="section-container">
        <h3 className="card-header">Select Report Type</h3>
        <div className="responsive-grid">
          <button
            onClick={() => setReportType('dashboard')}
            className={`btn-report ${reportType === 'dashboard' ? 'btn-report-active' : 'btn-report-inactive'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setReportType('daily')}
            className={`btn-report ${reportType === 'daily' ? 'btn-report-active' : 'btn-report-inactive'}`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setReportType('dateRange')}
            className={`btn-report ${reportType === 'dateRange' ? 'btn-report-active' : 'btn-report-inactive'}`}
          >
            Date Range
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`btn-report ${reportType === 'monthly' ? 'btn-report-active' : 'btn-report-inactive'}`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setReportType('yearly')}
            className={`btn-report ${reportType === 'yearly' ? 'btn-report-active' : 'btn-report-inactive'}`}
          >
            Yearly Report
          </button>
          <button
            onClick={() => setReportType('itemWise')}
            className={`btn-report ${reportType === 'itemWise' ? 'btn-report-active' : 'btn-report-inactive'}`}
          >
            Item-wise
          </button>
        </div>
      </div>

      {/* Date/Filter Controls - Only show for non-dashboard reports */}
      {reportType !== 'dashboard' && (
        <div className="section-container">
          <h3 className="card-header">Filters</h3>
        <div className="content-grid">
          {(reportType === 'daily') && (
            <div className="form-group">
              <label className="form-label">Select Date</label>
              <input
                type="date"
                value={dates.selectedDate}
                onChange={(e) => setDates(prev => ({...prev, selectedDate: e.target.value}))}
                className="form-input"
              />
            </div>
          )}

          {(reportType === 'dateRange' || reportType === 'itemWise') && (
            <>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={dates.dateRange.startDate}
                  onChange={(e) => setDates(prev => ({...prev, dateRange: {...prev.dateRange, startDate: e.target.value}}))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={dates.dateRange.endDate}
                  onChange={(e) => setDates(prev => ({...prev, dateRange: {...prev.dateRange, endDate: e.target.value}}))}
                  className="form-input"
                />
              </div>
            </>
          )}

          {reportType === 'monthly' && (
            <>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select
                  value={dates.selectedMonth.year}
                  onChange={(e) => setDates(prev => ({...prev, selectedMonth: {...prev.selectedMonth, year: parseInt(e.target.value)}}))}
                  className="form-input"
                >
                  {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Month</label>
                <select
                  value={dates.selectedMonth.month}
                  onChange={(e) => setDates(prev => ({...prev, selectedMonth: {...prev.selectedMonth, month: parseInt(e.target.value)}}))}
                  className="form-input"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{new Date(0, month - 1).toLocaleString('default', {month: 'long'})}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType === 'yearly' && (
            <div className="form-group">
              <label className="form-label">Year</label>
              <select
                value={dates.selectedYear}
                onChange={(e) => setDates(prev => ({...prev, selectedYear: parseInt(e.target.value)}))}
                className="form-input"
              >
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-muted">Loading report...</p>
        </div>
      )}

      {/* Report Content */}
      {!loading && renderReportContent()}
    </div>
  );
};

export default SalesReports;
