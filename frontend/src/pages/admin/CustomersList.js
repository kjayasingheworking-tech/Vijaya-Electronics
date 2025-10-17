import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useToast } from "../../components/ToastProvider";
import { generateCustomersReport } from "../../utils/pdfGenerator";

export default function CustomersList() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/customers");
        const onlyCustomers = (res.data.customers || []).filter(
          (c) => c.user?.role === "customer"
        );
        setCustomers(onlyCustomers);
      } catch (err) {
        console.error("Error fetching customers:", err);
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.user?.name?.toLowerCase().includes(term) ||
      c.user?.email?.toLowerCase().includes(term)
    );
  });

  const downloadCustomersPDF = () => {
    try {
      const pdf = generateCustomersReport(filtered, search);
      const filename = `customers-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const exportCSV = () => {
    try {
      const headers = [
        "Name",
        "Email",
        "Phone",
        "City",
        "Country",
        "Active",
        "Joined",
      ];
      const rows = filtered.map((c) => [
        c.user?.name || "",
        c.user?.email || "",
        c.phone || "",
        c.city || "",
        c.country || "",
        c.user?.isActive ? "Active" : "Inactive",
        new Date(c.user?.createdAt).toLocaleDateString("en-GB"),
      ]);
      const csv =
        headers.join(",") +
        "\n" +
        rows.map((r) => r.map((x) => `"${x}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "customers_list.csv";
      link.click();
      toast.success("Exported to CSV!");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const printPage = () => window.print();

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(to top, #eaf5ff 0%, #ffffff 100%)",
      padding: "30px 40px",
      fontFamily:
        "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
      flexWrap: "wrap",
      gap: 12,
    },
    title: {
      fontSize: 26,
      fontWeight: 800,
      color: "#123c70",
      background:
        "linear-gradient(90deg, #004aad 0%, #0066ff 40%, #f8b500 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    btnBar: { display: "flex", gap: 10, alignItems: "center" },
    search: {
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #cfd6e2",
      background: "#fff",
      color: "#333",
      width: 250,
      outline: "none",
      fontSize: 14,
    },
    actionBtn: (color1, color2) => ({
      background: `linear-gradient(90deg, ${color1}, ${color2})`,
      color: "#fff",
      padding: "10px 16px",
      borderRadius: 8,
      border: "none",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
      transition: "transform 0.2s",
    }),
    tableCard: {
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      padding: 20,
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 14,
      color: "#222",
    },
    th: {
      textAlign: "left",
      padding: "12px 10px",
      borderBottom: "2px solid #e6edf5",
      color: "#4a5568",
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    td: {
      padding: "10px 10px",
      borderBottom: "1px solid #eef2f7",
    },
    badge: (active) => ({
      background: active ? "#dcfce7" : "#fee2e2",
      color: active ? "#16a34a" : "#dc2626",
      fontWeight: 600,
      padding: "4px 10px",
      borderRadius: 8,
      fontSize: 12,
      display: "inline-block",
    }),
    viewBtn: {
      background: "#e0edff",
      border: "1px solid #93c5fd",
      color: "#1d4ed8",
      padding: "5px 12px",
      borderRadius: 8,
      fontWeight: 600,
      cursor: "pointer",
    },
    modalBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
    },
    modalBox: {
      width: "90%",
      maxWidth: 520,
      background: "#ffffff",
      borderRadius: 12,
      padding: 24,
      boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
      color: "#1a202c",
      position: "relative",
      border: "1px solid #e5e7eb",
    },
    modalClose: {
      position: "absolute",
      top: 12,
      right: 16,
      fontSize: 20,
      cursor: "pointer",
      color: "#666",
    },
    modalTitle: { fontSize: 20, fontWeight: 800, marginBottom: 14 },
    modalField: { marginBottom: 10, fontSize: 15 },
    modalLabel: { color: "#374151", fontWeight: 600 },
    modalValue: { color: "#1e293b", marginLeft: 4 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Customer Management</h1>
        <div style={styles.btnBar}>
          <input
            style={styles.search}
            type="text"
            placeholder=" Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={downloadCustomersPDF}
            style={styles.actionBtn("#FFA500", "#ffb733")}
          >
            📄 Export PDF
          </button>
          <button
            onClick={exportCSV}
            style={styles.actionBtn("#1d4ed8", "#60a5fa")}
          >
            ⬇️ Export CSV
          </button>
          <button
            onClick={printPage}
            style={styles.actionBtn("#f59e0b", "#fbbf24")}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading customers...</p>
      ) : filtered.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <div style={styles.tableCard}>
          <h3
            style={{
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 12,
              fontSize: 18,
            }}
          >
            Active Customers
          </h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>City</th>
                <th style={styles.th}>Country</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c._id}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{c.user?.name || "—"}</td>
                  <td style={styles.td}>{c.user?.email || "—"}</td>
                  <td style={styles.td}>{c.phone || "—"}</td>
                  <td style={styles.td}>{c.city || "—"}</td>
                  <td style={styles.td}>{c.country || "—"}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(c.user?.isActive)}>
                      {c.user?.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(c.user?.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.viewBtn}
                      onClick={() => setSelected(c)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={styles.modalBackdrop} onClick={() => setSelected(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalClose} onClick={() => setSelected(null)}>
              ✖
            </div>
            <div style={styles.modalTitle}>
              {selected.user?.name || "Customer Details"}
            </div>
            <div style={styles.modalField}>
              <span style={styles.modalLabel}>Email:</span>
              <span style={styles.modalValue}>{selected.user?.email}</span>
            </div>
            <div style={styles.modalField}>
              <span style={styles.modalLabel}>Phone:</span>
              <span style={styles.modalValue}>{selected.phone || "—"}</span>
            </div>
            <div style={styles.modalField}>
              <span style={styles.modalLabel}>Address 1:</span>
              <span style={styles.modalValue}>
                {selected.addressLine1 || "—"}
              </span>
            </div>
            <div style={styles.modalField}>
              <span style={styles.modalLabel}>Address 2:</span>
              <span style={styles.modalValue}>
                {selected.addressLine2 || "—"}
              </span>
            </div>
            <div style={styles.modalField}>
              <span style={styles.modalLabel}>City:</span>
              <span style={styles.modalValue}>{selected.city || "—"}</span>
            </div>
            <div style={styles.modalField}>
              <span style={styles.modalLabel}>Country:</span>
              <span style={styles.modalValue}>{selected.country || "—"}</span>
            </div>
            <div style={styles.modalField}>
              <span style={styles.modalLabel}>Status:</span>
              <span style={styles.modalValue}>
                {selected.user?.isActive ? "Active " : "Inactive "}
              </span>
            </div>
            <div style={styles.modalField}>
              <span style={styles.modalLabel}>Joined:</span>
              <span style={styles.modalValue}>
                {new Date(selected.user?.createdAt).toLocaleString("en-GB")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
