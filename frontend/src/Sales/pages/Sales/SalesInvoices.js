import { useState, useEffect } from "react";
import { Plus, Eye, Download, Printer, Trash2 } from "lucide-react";
import "../../styles/sales.css";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CreateInvoice from "../../components/Sales/Invoices/CreateInvoice";
import ViewInvoice from "../../components/Sales/Invoices/ViewInvoice";
import { API, API_ENDPOINTS } from "../../constants/salesApi";

const SalesInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`${API}${API_ENDPOINTS.INVOICES}`);
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const data = await res.json();
        setInvoices(data);
        // Sort by createdAt descending (newest first)
        const sorted = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setInvoices(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Delete invoice
  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const res = await fetch(`${API}${API_ENDPOINTS.INVOICE_BY_ID(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");

      setInvoices((prev) => prev.filter((inv) => inv._id !== id));
      alert("Invoice deleted successfully");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Download invoice as PDF
  const handleDownloadInvoice = (invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Helper functions for date/time formatting
    const formatDate = (date) => new Date(date).toLocaleDateString(
      undefined, {
      day: "2-digit", month: "short", year: "numeric"
    });

    const formatTime = (date) => new Date(date).toLocaleTimeString(
      undefined, { hour: "2-digit", minute: "2-digit" }
    );

    // Calculate discount amount
    const discountAmount = invoice.discountAmount || (invoice.subtotal * (invoice.discountPercent || 0) / 100);

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204);
    doc.text('INVOICE', margin, 35);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Vijaya Electronics', margin, 45);

    // Draw border line under header
    doc.setLineWidth(1);
    doc.line(margin, 55, pageWidth - margin, 55);

    let yPosition = 70;

    // Left side - Invoice Number and Customer Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice Number: ${invoice.invoiceNumber || invoice._id}`, margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customerSnapshot?.name || 'Unknown Customer', margin, yPosition);
    yPosition += 8;

    if (invoice.customerSnapshot?.email) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(invoice.customerSnapshot.email, margin, yPosition);
      yPosition += 6;
    }

    if (invoice.customerSnapshot?.phone) {
      doc.text(invoice.customerSnapshot.phone, margin, yPosition);
      yPosition += 6;
    }

    if (invoice.customerSnapshot?.address) {
      doc.text(invoice.customerSnapshot.address, margin, yPosition);
      yPosition += 10;
    } else {
      yPosition += 4;
    }

    // Right side - Invoice details
    const rightColumnX = pageWidth - 100;
    let rightY = 70;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice Date: ${formatDate(invoice.createdAt)}`, rightColumnX, rightY);
    rightY += 6;
    doc.text(`Time: ${formatTime(invoice.createdAt)}`, rightColumnX, rightY);
    rightY += 6;
    doc.text(`Payment: ${invoice.paymentMethod}`, rightColumnX, rightY);
    rightY += 6;

    // Payment Details for Cheque
    if (invoice.paymentMethod === "Cheque" && invoice.paymentDetails) {
      doc.setFontSize(8);
      doc.text(`Cheque #: ${invoice.paymentDetails.chequeNumber}`, rightColumnX, rightY);
      rightY += 5;
      doc.text(`Bank: ${invoice.paymentDetails.bank}`, rightColumnX, rightY);
      rightY += 5;
      doc.text(`Amount: Rs.${invoice.paymentDetails.amount}`, rightColumnX, rightY);
      rightY += 5;
      doc.text(`Date: ${formatDate(invoice.paymentDetails.issueDate)}`, rightColumnX, rightY);
      rightY += 8;
    }

    // Status
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    if (invoice.status === "Paid") {
      doc.setTextColor(0, 128, 0);
    } else {
      doc.setTextColor(255, 0, 0);
    }
    doc.text(`Status: ${invoice.status}`, rightColumnX, rightY);

    // Draw border line
    yPosition = Math.max(yPosition, rightY) + 15;
    doc.setLineWidth(1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Order Summary header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Order Summary', margin, yPosition);
    yPosition += 15;

    // Items Table
    const tableData = invoice.items.map(item => [
      item.name,
      item.quantity.toString(),
      `Rs. ${item.unitPrice}`,
      `Rs. ${item.total}`
    ]);

    autoTable(doc, {
      head: [['Item', 'Qty', 'Unit Price (Rs.)', 'Total (Rs.)']],
      body: tableData,
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Order Summary
    const summaryStartX = pageWidth - 120;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    // Subtotal
    doc.text(`Subtotal (${invoice.items.length} items)`, summaryStartX, yPosition);
    doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, pageWidth - margin - 20, yPosition);
    yPosition += 8;

    // Discount
    if (invoice.discountPercent > 0 || invoice.discountAmount > 0) {
      const discountText = invoice.discountType === "Percentage"
        ? `Discount (${invoice.discountPercent}%)`
        : `Discount (Rs.${invoice.discountAmount})`;

      doc.text(discountText, summaryStartX, yPosition);
      doc.setTextColor(255, 0, 0);
      doc.text(`- Rs.${discountAmount.toFixed(2)}`, pageWidth - margin - 20, yPosition);
      doc.setTextColor(100, 100, 100);
      yPosition += 8;
    }

    // Points Redeemed
    if (invoice.pointsRedeemed > 0) {
      doc.text('Points Redeemed', summaryStartX, yPosition);
      doc.setTextColor(255, 165, 0);
      doc.text(`- Rs.${invoice.pointsRedeemed.toFixed(2)}`, pageWidth - margin - 20, yPosition);
      doc.setTextColor(100, 100, 100);
      yPosition += 8;
    }

    // Total line and amount
    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(summaryStartX, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Total', summaryStartX, yPosition);
    doc.text(`Rs.${invoice.totalAmount.toFixed(2)}`, pageWidth - margin - 20, yPosition);
    yPosition += 12;

    // Points Awarded
    if (invoice.pointsAwarded > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Loyalty Points Awarded: ${invoice.pointsAwarded}`, pageWidth - margin - 20, yPosition, { align: 'right' });
    }

    // Footer
    yPosition = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', margin, yPosition);
    doc.text(`Generated on ${formatDate(new Date())} at ${formatTime(new Date())}`, pageWidth - margin - 20, yPosition, { align: 'right' });

    // Save the PDF
    const fileName = `Invoice-${invoice.invoiceNumber || invoice._id.slice(-6)}-${formatDate(invoice.createdAt).replace(/\s/g, '')}.pdf`;
    doc.save(fileName);
  };

  // Print invoice
  const handlePrintInvoice = (invoice) => {
    // Open the invoice in a new window for printing
    const printWindow = window.open('', '_blank');

    // Helper functions for date/time formatting
    const formatDate = (date) => new Date(date).toLocaleDateString(
      undefined, {
      day: "2-digit", month: "short", year: "numeric"
    });

    const formatTime = (date) => new Date(date).toLocaleTimeString(
      undefined, { hour: "2-digit", minute: "2-digit" }
    );

    const discountAmount = invoice.discountAmount || (invoice.subtotal * (invoice.discountPercent || 0) / 100);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber || invoice._id.slice(-6)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 24px;
            color: #333;
            line-height: 1.6;
            background: white;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 24px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .company-info h1 {
            color: #0066cc;
            font-size: 32px;
            margin: 0;
            font-weight: bold;
          }
          .company-info h2 {
            color: #6b7280;
            font-size: 18px;
            margin: 4px 0 0 0;
            font-weight: 600;
          }
          .invoice-details {
            text-align: right;
            font-size: 12px;
          }
          .invoice-details p {
            margin: 0 0 4px 0;
            color: #6b7280;
          }
          .customer-name {
            font-weight: 600;
            color: #374151;
            margin: 4px 0;
          }
          .status-paid { color: #16a34a; font-weight: 600; }
          .status-unpaid { color: #dc2626; font-weight: 600; }
          .status-pending { color: #ea580c; font-weight: 600; }

          .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }

          .customer-section p {
            margin: 0 0 4px 0;
          }

          .order-summary {
            font-weight: bold;
            font-size: 18px;
            color: #374151;
            margin: 16px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 14px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 12px;
          }
          th {
            background-color: #f9fafb;
            font-weight: bold;
            text-align: left;
          }
          td:nth-child(2), td:nth-child(3), td:nth-child(4) {
            text-align: right;
          }

          .summary-section {
            background: white;
            padding: 24px 0;
            max-width: 384px;
            margin-left: auto;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            color: #6b7280;
          }
          .summary-total {
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            margin-top: 8px;
          }
          .summary-final {
            font-weight: bold;
            color: #374151;
            font-size: 18px;
          }
          .discount { color: #dc2626; }
          .points { color: #ea580c; }

          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            .invoice-container {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <h1>INVOICE</h1>
              <h2>Wijaya Electronics</h2>
            </div>
          </div>

          <div class="main-content">
            <div class="customer-section">
              <p><strong>Invoice Number: ${invoice.invoiceNumber || invoice._id}</strong></p>
              <p class="customer-name">${invoice.customerSnapshot?.name || 'Unknown Customer'}</p>
              ${invoice.customerSnapshot?.email ? `<p>${invoice.customerSnapshot.email}</p>` : ''}
              ${invoice.customerSnapshot?.phone ? `<p>${invoice.customerSnapshot.phone}</p>` : ''}
              ${invoice.customerSnapshot?.address ? `<p>${invoice.customerSnapshot.address}</p>` : ''}
            </div>

            <div class="invoice-details">
              <p>Invoice Date: ${formatDate(invoice.createdAt)}</p>
              <p>Time: ${formatTime(invoice.createdAt)}</p>
              <p>Payment: ${invoice.paymentMethod}</p>
              <p class="status-${invoice.status.toLowerCase()}">Status: ${invoice.status}</p>
            </div>
          </div>

          <h3 class="order-summary">Order Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price (Rs.)</th>
                <th>Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>Rs. ${item.unitPrice}</td>
                  <td>Rs. ${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="summary-row">
              <span>Subtotal (${invoice.items.length} items)</span>
              <span>Rs.${invoice.subtotal.toFixed(2)}</span>
            </div>
            ${invoice.discountPercent > 0 || invoice.discountAmount > 0 ? `
            <div class="summary-row discount">
              <span>Discount ${invoice.discountType === "Percentage" ? `(${invoice.discountPercent}%)` : `(Rs.${invoice.discountAmount})`}</span>
              <span>- Rs.${discountAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${invoice.pointsRedeemed > 0 ? `
            <div class="summary-row points">
              <span>Points Redeemed</span>
              <span>- Rs.${invoice.pointsRedeemed.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="summary-row summary-total summary-final">
              <span>Total</span>
              <span>Rs.${invoice.totalAmount.toFixed(2)}</span>
            </div>
            ${invoice.pointsAwarded > 0 ? `
            <div style="text-align: right; margin-top: 8px; font-size: 12px; color: #6b7280;">
              Loyalty Points Awarded: ${invoice.pointsAwarded}
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <div>Thank you for your business!</div>
            <div>Generated on ${formatDate(new Date())} at ${formatTime(new Date())}</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter(invoice => {
    // Check if invoice matches search term
    const invoiceNumber = invoice.invoiceNumber || invoice._id.slice(-6);
    const customerName = invoice.customerSnapshot?.name || "";
    const searchMatch = invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if invoice matches status filter
    const statusMatch = filterStatus === "all" || invoice.status === filterStatus;
    // Invoice is shown if it matches both search and status filter
    return searchMatch && statusMatch;
  });

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-create"
        >
          <Plus className="h-5 w-5" /> Create Invoice
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
        </div>
        
        {/* Status Filter */}
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Invoice Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredInvoices.length} of {invoices.length} invoices
      </div>

      {/* View Invoices */}
      {loading ? (
        <p>Loading invoices...</p>
      ) : (
        <div className="invoice-grid max-w-7xl mx-auto">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <div
                key={invoice._id}
                className="bg-white shadow rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Invoice #{invoice.invoiceNumber || invoice._id.slice(-6)}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      invoice.status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : invoice.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : invoice.status === "Unpaid"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>

                {/* Customer */}
                <p className="text-gray-600 text-sm mb-2">
                  {invoice.customerSnapshot?.name || "Unknown Customer"}
                </p>

                {/* Total */}
                <p className="text-lg font-bold text-gray-900 mb-3">
                  Rs.{invoice.totalAmount || 0}
                </p>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-auto">
                  <button
                    onClick={() => setSelectedInvoice(invoice)}
                    className="p-2 border rounded hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="p-2 border rounded hover:bg-gray-50"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handlePrintInvoice(invoice)}
                    className="p-2 border rounded hover:bg-gray-50"
                    title="Print Invoice"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(invoice._id)}
                    className="p-2 border rounded hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-full">
              {invoices.length === 0 ? "No invoices found" : "No invoices match your search criteria"}
            </p>
          )}
        </div>

      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateInvoice
          onClose={() => setShowCreate(false)}
          onCreate={(invoice) => setInvoices((prev) => [...prev, invoice])}
        />
      )}

      {/* View Modal */}
      {selectedInvoice && (
        <ViewInvoice
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default SalesInvoices;
