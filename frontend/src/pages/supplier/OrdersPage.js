import React, { useEffect, useState } from "react";
import { listSupplierPOs } from "../../api/supplier";
import PoStatusBadge from "../../components/supplier/PoStatusBadge";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

const downloadOrdersReport = (orders, statusFilter) => {
  if (!orders || orders.length === 0) {
    alert("No orders to download");
    return;
  }

  // Create PDF directly
  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const currentDate = new Date().toLocaleDateString('en-GB');
    const filterText = statusFilter ? ` (${statusFilter.toUpperCase()})` : ' (ALL ORDERS)';
    
    // Set up colors
    const primaryColor = [14, 165, 233]; // Blue
    const textColor = [31, 41, 55]; // Dark gray
    const lightBg = [248, 250, 252]; // Light gray
    
    // Header with gradient background simulation
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, 210, 45, 'F');
    
    // Company logo and title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VIJAYA ELECTRONICS', 105, 20, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Supplier Orders Report${filterText}`, 105, 30, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Generated on ${currentDate}`, 105, 38, { align: 'center' });
    
    // Reset text color for body
    pdf.setTextColor(...textColor);
    
    // Summary statistics
    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
    
    // Summary boxes
    pdf.setFillColor(...lightBg);
    pdf.rect(20, 55, 50, 25, 'F');
    pdf.rect(80, 55, 50, 25, 'F');
    pdf.rect(140, 55, 50, 25, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('TOTAL ORDERS', 45, 63, { align: 'center' });
    pdf.text('TOTAL VALUE', 105, 63, { align: 'center' });
    pdf.text('REPORT DATE', 165, 63, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(totalOrders.toString(), 45, 72, { align: 'center' });
    pdf.text(`Rs. ${totalValue.toLocaleString()}`, 105, 72, { align: 'center' });
    pdf.text(currentDate, 165, 72, { align: 'center' });
    
    // Table data preparation
    const tableData = orders.map(order => [
      order.poNumber || `PO-${order._id.slice(-6)}`,
      order.status || 'N/A',
      `${order.items?.length || 0} items`,
      `Rs. ${(order.totals?.grandTotal || 0).toLocaleString()}`,
      new Date(order.createdAt).toLocaleDateString('en-GB')
    ]);
    
    // Add total row
    tableData.push([
      'TOTAL',
      '',
      '',
      `Rs. ${totalValue.toLocaleString()}`,
      ''
    ]);
    
    // Create table
    autoTable(pdf, {
      startY: 90,
      head: [['PO Number', 'Status', 'Items', 'Amount (LKR)', 'Created Date']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        3: { halign: 'right' } // Right align amount column
      },
      didParseCell: function(data) {
        // Style the total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = lightBg;
        }
      },
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    });
    
    // Footer
    const finalY = (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? pdf.lastAutoTable.finalY + 20 : 200;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Vijaya Electronics - Supplier Portal', 105, finalY, { align: 'center' });
    pdf.text(`Report generated on ${new Date().toLocaleString()} | Confidential Document`, 105, finalY + 7, { align: 'center' });
    
    // Save the PDF
    const fileName = `supplier-orders-${statusFilter || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };
  
  generatePDF();
};

const FILTERS = [
  { key: "", label: "All" },
  { key: "new", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "packing", label: "Packing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "checking", label: "Checking" },
  { key: "inquired", label: "Inquired" },
  { key: "pending_payment", label: "Pending" },
  { key: "payment_done", label: "Paid" },
  { key: "closed", label: "Closed" },
];

export default function OrdersPage() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSupplierPOs(status || undefined);
      setRows(data);
    } catch (e) {
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [status]);

  return (
    <main style={page}>
      <header style={head}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Supplier Orders</h2>
          <div style={{ color: "#64748b" }}>Browse purchase orders assigned to you.</div>
        </div>

        <button
          onClick={() => downloadOrdersReport(rows, status)}
          style={{
            padding: "12px 20px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={e => {
            e.target.style.transform = "translateY(-2px) scale(1.02)";
            e.target.style.boxShadow = "0 6px 20px rgba(16,185,129,0.4)";
          }}
          onMouseOut={e => {
            e.target.style.transform = "translateY(0) scale(1)";
            e.target.style.boxShadow = "0 4px 12px rgba(16,185,129,0.25)";
          }}
        >
          � Download PDF Report
        </button>

        <div style={filterWrap}>
          {FILTERS.map((f) => (
            <button
              key={f.key || "all"}
              onClick={() => setStatus(f.key)}
              style={{
                ...chip,
                background:
                  status === f.key
                    ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                    : "#fff",
                color: status === f.key ? "#fff" : "#0f172a",
                borderColor: status === f.key ? "#0284c7" : "#cbd5e1",
                transform: status === f.key ? "scale(1.05)" : "scale(1)",
                boxShadow:
                  status === f.key
                    ? "0 2px 8px rgba(14,165,233,0.3)"
                    : "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {loading && <div style={{ padding: 12 }}>Loading…</div>}
      {!loading && (!rows || rows.length === 0) && (
        <div style={{ padding: 12 }}>No orders.</div>
      )}

      <div style={grid}>
        {(rows || []).map((po, i) => (
          <article
            key={po._id}
            className="po-card"
            style={{
              ...card,
              animation: `fadeIn 0.5s ease ${(i + 1) * 0.08}s both`,
            }}
          >
            <div style={cardHead}>
              <div style={{ fontWeight: 700, fontSize: "1.1em" }}>
                {po.poNumber || `PO #${po._id.slice(-6)}`}
              </div>
              <PoStatusBadge value={po.status} />
            </div>

            <div style={{ marginTop: 6 }}>
              <div style={row}>
                <span>Items</span>
                <b>{po.items?.length || 0}</b>
              </div>
              <div style={row}>
                <span>Total</span>
                <b>{money(po?.totals?.grandTotal)}</b>
              </div>
            </div>

            <div style={cardFooter}>
              <Link to={`/supplier/orders/${po._id}`} style={ghostBtn}>
                View
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Inline Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .po-card {
          transition: all 0.3s ease;
        }

        .po-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: #38bdf8;
          box-shadow: 0 8px 18px rgba(56,189,248,0.25);
          background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
        }

        .po-card:hover span, 
        .po-card:hover b {
          color: #0369a1;
        }



        .po-card:hover a:hover {
          background: #0284c7;
        }

         .po-card:hover a {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: white;
          border-color: #0ea5e9;
          box-shadow: 0 4px 10px rgba(14,165,233,0.25);
          transform: scale(1.03);
        }

        .po-card a {
          transition: all 0.3s ease;
        }

        .po-card a:hover {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          box-shadow: 0 6px 12px rgba(14,165,233,0.35);
          transform: scale(1.06);
        }

        .po-card a:active {
          transform: scale(0.97);
          box-shadow: 0 3px 8px rgba(14,165,233,0.3);
        }
      `}</style>
    </main>
  );
}

// 💅 Styles
const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)",
  padding: "24px",
  color: "#0f172a",
  fontFamily: "Inter, sans-serif",
};

const head = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
  flexWrap: "wrap",
  gap: 12,
};

const filterWrap = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 8,
};

const card = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  transition: "all 0.3s ease",
  cursor: "pointer",
  position: "relative",
};

const cardHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "4px 0",
};

const cardFooter = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 10,
};

const chip = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid",
  cursor: "pointer",
  fontWeight: 600,
  background: "#fff",
};

const ghostBtn = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 700,
  background: "#f1f5f9",
  transition: "all 0.25s ease",
  display: "inline-block",
};