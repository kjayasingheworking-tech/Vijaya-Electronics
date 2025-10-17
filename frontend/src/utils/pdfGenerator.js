import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Company branding
const COMPANY_NAME = "Vijaya Electronics";
const COMPANY_ADDRESS = "123 Electronics Street, Tech City, TC 12345";
const COMPANY_PHONE = "+1 (555) 123-4567";
const COMPANY_EMAIL = "info@vijayaelectronics.com";

// Colors
const PRIMARY_COLOR = "#0057B8";
const SECONDARY_COLOR = "#FFA500";
const GRAY_COLOR = "#6c757d";

export class PDFGenerator {
  constructor() {
    this.doc = new jsPDF();
    this.currentY = 20;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  // Add company header
  addHeader(title, subtitle = null) {
    // Company logo area (you can add actual logo later)
    this.doc.setFillColor(0, 87, 184); // PRIMARY_COLOR as RGB
    this.doc.rect(20, 15, 170, 25, 'F');
    
    // Company name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(COMPANY_NAME, 25, 30);
    
    // Title
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(title, 25, 36);
    
    this.currentY = 50;
    
    // Subtitle if provided
    if (subtitle) {
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.text(subtitle, 20, this.currentY);
      this.currentY += 15;
    }
    
    // Report details
    this.doc.setTextColor(108, 117, 125); // GRAY_COLOR as RGB
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, this.currentY);
    this.currentY += 20;
  }

  // Add footer
  addFooter() {
    const footerY = this.pageHeight - 30;
    
    // Footer line
    this.doc.setDrawColor(0, 87, 184); // PRIMARY_COLOR as RGB
    this.doc.setLineWidth(0.5);
    this.doc.line(20, footerY, this.pageWidth - 20, footerY);
    
    // Company details
    this.doc.setTextColor(108, 117, 125); // GRAY_COLOR as RGB
    this.doc.setFontSize(8);
    this.doc.text(COMPANY_ADDRESS, 20, footerY + 8);
    this.doc.text(`Phone: ${COMPANY_PHONE} | Email: ${COMPANY_EMAIL}`, 20, footerY + 15);
    
    // Page number
    const pageCount = this.doc.internal.getNumberOfPages();
    this.doc.text(`Page ${pageCount}`, this.pageWidth - 40, footerY + 8);
  }

  // Check if we need a new page
  checkPageBreak(requiredHeight = 20) {
    if (this.currentY + requiredHeight > this.pageHeight - 50) { // More conservative margin
      this.doc.addPage();
      this.currentY = 20;
      return true;
    }
    return false;
  }

  // Add summary stats section
  addSummaryStats(stats) {
    this.checkPageBreak(40);
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('Summary Statistics', 20, this.currentY);
    this.currentY += 15;

    const statsPerRow = 3;
    const boxWidth = (this.pageWidth - 60) / statsPerRow;
    const boxHeight = 25;
    
    stats.forEach((stat, index) => {
      const row = Math.floor(index / statsPerRow);
      const col = index % statsPerRow;
      const x = 20 + (col * boxWidth) + (col * 10);
      const y = this.currentY + (row * (boxHeight + 10));
      
      // Box background
      this.doc.setFillColor(245, 245, 245);
      this.doc.rect(x, y, boxWidth, boxHeight, 'F');
      
      // Box border
      this.doc.setDrawColor(200, 200, 200);
      this.doc.rect(x, y, boxWidth, boxHeight);
      
      // Value
      this.doc.setTextColor(0, 87, 184); // PRIMARY_COLOR as RGB
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.text(stat.value.toString(), x + 5, y + 12, { align: 'left' });
      
      // Label
      this.doc.setTextColor(108, 117, 125); // GRAY_COLOR as RGB
      this.doc.setFontSize(9);
      this.doc.setFont(undefined, 'normal');
      this.doc.text(stat.label, x + 5, y + 20, { align: 'left' });
    });
    
    const rows = Math.ceil(stats.length / statsPerRow);
    this.currentY += (rows * (boxHeight + 10)) + 20;
  }

  // Add data table
  addTable(columns, data, title = null) {
    this.checkPageBreak(30);
    
    if (title) {
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(12);
      this.doc.setFont(undefined, 'bold');
      this.doc.text(title, 20, this.currentY);
      this.currentY += 15;
    }

    // Calculate optimal column widths based on content
    const pageWidth = this.pageWidth - 30; // Account for margins
    const numColumns = columns.length;
    const baseWidth = pageWidth / numColumns;
    
    // Create dynamic column styles
    const columnStyles = {};
    columns.forEach((col, index) => {
      columnStyles[index] = { 
        cellWidth: baseWidth,
        overflow: 'linebreak',
        cellPadding: 2
      };
    });

    autoTable(this.doc, {
      head: [columns],
      body: data,
      startY: this.currentY,
      theme: 'grid',
      styles: {
        fontSize: 8, // Smaller font to fit more content
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [0, 87, 184], // PRIMARY_COLOR as RGB array
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: columnStyles,
      margin: { left: 15, right: 15, bottom: 50 }, // Reduced margins for more space
      pageBreak: 'auto',
      showHead: 'everyPage',
      tableWidth: 'auto', // Let table adjust to page width
      didDrawPage: (data) => {
        // Only add footer if it's not the last page or if the table has finished
        this.addFooter();
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 20;
  }

  // Add text section
  addSection(title, content) {
    this.checkPageBreak(30);
    
    // Section title
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, 20, this.currentY);
    this.currentY += 15;
    
    // Section content
    this.doc.setTextColor(108, 117, 125); // GRAY_COLOR as RGB
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    
    const lines = this.doc.splitTextToSize(content, this.pageWidth - 40);
    this.doc.text(lines, 20, this.currentY);
    this.currentY += (lines.length * 5) + 15;
  }

  // Save the PDF
  save(filename) {
    // Footer is already added by autoTable's didDrawPage
    // Only add footer if current page doesn't have one
    if (this.currentY < this.pageHeight - 50) {
      this.addFooter();
    }
    this.doc.save(filename);
  }
}

// Utility functions for different admin reports
export const generateSuppliersReport = (suppliers, searchTerm = '') => {
  const pdf = new PDFGenerator();
  
  const title = 'Suppliers Management Report';
  const subtitle = searchTerm ? `Filtered by: "${searchTerm}"` : 'All Suppliers';
  
  pdf.addHeader(title, subtitle);
  
  // Summary stats
  const activeSuppliers = suppliers.filter(s => s.user?.isActive).length;
  const inactiveSuppliers = suppliers.length - activeSuppliers;
  
  const stats = [
    { label: 'Total Suppliers', value: suppliers.length },
    { label: 'Active Suppliers', value: activeSuppliers },
    { label: 'Inactive Suppliers', value: inactiveSuppliers },
  ];
  
  pdf.addSummaryStats(stats);
  
  // Suppliers table
  const columns = ['Company', 'Email', 'Phone', 'City', 'Status', 'Joined'];
  const data = suppliers.map(supplier => [
    (supplier.user?.name || 'N/A').substring(0, 25) + ((supplier.user?.name || '').length > 25 ? '...' : ''),
    (supplier.user?.email || 'N/A').substring(0, 30) + ((supplier.user?.email || '').length > 30 ? '...' : ''),
    supplier.contactDetails?.phone || 'N/A',
    (supplier.contactDetails?.city || 'N/A').substring(0, 15) + ((supplier.contactDetails?.city || '').length > 15 ? '...' : ''),
    supplier.user?.isActive ? 'Active' : 'Inactive',
    supplier.user?.createdAt ? new Date(supplier.user.createdAt).toLocaleDateString() : 'N/A'
  ]);
  
  pdf.addTable(columns, data, 'Suppliers List');
  
  return pdf;
};

export const generateProductsReport = (products, filters = {}) => {
  const pdf = new PDFGenerator();
  
  const title = 'Products Inventory Report';
  let subtitle = 'All Products';
  if (filters.category) subtitle += ` | Category: ${filters.category}`;
  if (filters.supplier) subtitle += ` | Supplier: ${filters.supplier}`;
  if (filters.search) subtitle += ` | Search: "${filters.search}"`;
  
  pdf.addHeader(title, subtitle);
  
  // Summary stats
  const totalValue = products.reduce((sum, p) => {
    const price = Number(p.price) || 0;
    const stock = Number(p.stock) || 0;
    return sum + (price * stock);
  }, 0);
  const lowStockItems = products.filter(p => (Number(p.stock) || 0) < 10).length;
  
  const stats = [
    { label: 'Total Products', value: products.length },
    { label: 'Low Stock Items', value: lowStockItems },
    { label: 'Total Inventory Value', value: `$${totalValue.toLocaleString()}` },
  ];
  
  pdf.addSummaryStats(stats);
  
  // Products table
  const columns = ['Product', 'SKU', 'Category', 'Supplier', 'Price', 'Stock'];
  const data = products.map(product => [
    (product.name || 'N/A').substring(0, 25) + ((product.name || '').length > 25 ? '...' : ''),
    (product.sku || 'N/A').substring(0, 15) + ((product.sku || '').length > 15 ? '...' : ''),
    ((product.categories || []).join(', ') || 'N/A').substring(0, 20) + (((product.categories || []).join(', ') || '').length > 20 ? '...' : ''),
    (product.supplier?.name || 'N/A').substring(0, 20) + ((product.supplier?.name || '').length > 20 ? '...' : ''),
    `$${(Number(product.price) || 0).toFixed(2)}`,
    (Number(product.stock) || 0).toString()
  ]);
  
  pdf.addTable(columns, data, 'Products List');
  
  return pdf;
};

export const generateCustomersReport = (customers, searchTerm = '') => {
  const pdf = new PDFGenerator();
  
  const title = 'Customers Management Report';
  const subtitle = searchTerm ? `Filtered by: "${searchTerm}"` : 'All Customers';
  
  pdf.addHeader(title, subtitle);
  
  // Summary stats
  const activeCustomers = customers.filter(c => c.user?.isActive).length;
  const inactiveCustomers = customers.length - activeCustomers;
  
  const stats = [
    { label: 'Total Customers', value: customers.length },
    { label: 'Active Customers', value: activeCustomers },
    { label: 'Inactive Customers', value: inactiveCustomers },
  ];
  
  pdf.addSummaryStats(stats);
  
  // Customers table
  const columns = ['Name', 'Email', 'Phone', 'City', 'Country', 'Status', 'Joined'];
  const data = customers.map(customer => [
    (customer.user?.name || 'N/A').substring(0, 20) + ((customer.user?.name || '').length > 20 ? '...' : ''),
    (customer.user?.email || 'N/A').substring(0, 25) + ((customer.user?.email || '').length > 25 ? '...' : ''),
    (customer.phone || 'N/A').substring(0, 15),
    (customer.city || 'N/A').substring(0, 15) + ((customer.city || '').length > 15 ? '...' : ''),
    (customer.country || 'N/A').substring(0, 12) + ((customer.country || '').length > 12 ? '...' : ''),
    customer.user?.isActive ? 'Active' : 'Inactive',
    customer.user?.createdAt ? new Date(customer.user.createdAt).toLocaleDateString() : 'N/A'
  ]);
  
  pdf.addTable(columns, data, 'Customers List');
  
  return pdf;
};

export const generateInvoicesReport = (invoices, filters = {}) => {
  const pdf = new PDFGenerator();
  
  const title = 'Invoices Report';
  let subtitle = 'All Invoices';
  if (filters.status) subtitle += ` | Status: ${filters.status}`;
  if (filters.supplier) subtitle += ` | Supplier: ${filters.supplier}`;
  
  pdf.addHeader(title, subtitle);
  
  // Summary stats
  const totalAmount = invoices.reduce((sum, inv) => {
    const amount = Number(inv.totalAmount) || 0;
    return sum + amount;
  }, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  
  const stats = [
    { label: 'Total Invoices', value: invoices.length },
    { label: 'Paid Invoices', value: paidInvoices },
    { label: 'Pending Invoices', value: pendingInvoices },
    { label: 'Total Amount', value: `$${totalAmount.toLocaleString()}` },
  ];
  
  pdf.addSummaryStats(stats);
  
  // Invoices table
  const columns = ['Invoice ID', 'Supplier', 'Date', 'Amount', 'Status', 'Due Date'];
  const data = invoices.map(invoice => [
    (invoice.invoiceNumber || invoice._id?.slice(-8) || 'N/A').substring(0, 15),
    (invoice.supplier?.name || 'N/A').substring(0, 20) + ((invoice.supplier?.name || '').length > 20 ? '...' : ''),
    invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A',
    `$${(Number(invoice.totalAmount) || 0).toFixed(2)}`,
    (invoice.status || 'pending').toUpperCase(),
    invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'
  ]);
  
  pdf.addTable(columns, data, 'Invoices List');
  
  return pdf;
};