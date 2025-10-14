import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const EyeOpen = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeClosed = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.79 21.79 0 0 1 5.64-7.22M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.75 21.75 0 0 1-2.1 3.12M15 12a3 3 0 1 1-3-3M2 2l20 20"></path>
  </svg>
);

export default function SupplierManagement() {
  const [tab, setTab] = useState("active");
  const [active, setActive] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, supplier: null });
  const [view, setView] = useState({ open: false, data: null });
  const [showPassword, setShowPassword] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
 

  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    tempPassword: "",
    confirmPassword: "",
    companyName: "",
    address: "",
    branch: "",
    contactDetails: { email: "", phone: "" },
    bankAccount: { accountNumber: "", bankName: "", bankBranch: "" },
    contactPerson: { name: "", designation: "", phone: "" },
  });

  const resetForm = () =>
    setForm({
      userName: "",
      userEmail: "",
      tempPassword: "",
      confirmPassword: "",
      companyName: "",
      address: "",
      branch: "",
      contactDetails: { email: "", phone: "" },
      bankAccount: { accountNumber: "", bankName: "", bankBranch: "" },
      contactPerson: { name: "", designation: "", phone: "" },
    });

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  const phoneRegex = /^\d{10}$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const canSave = useMemo(() => {
    const f = form;
    return (
      f.userName &&
      gmailRegex.test(f.userEmail) &&
      f.companyName &&
      f.address &&
      f.branch &&
      gmailRegex.test(f.contactDetails.email) &&
      phoneRegex.test(f.contactDetails.phone) &&
      f.bankAccount.accountNumber &&
      f.bankAccount.bankName &&
      f.bankAccount.bankBranch &&
      f.contactPerson.name &&
      f.tempPassword &&
      f.confirmPassword === f.tempPassword &&
      passwordRegex.test(f.tempPassword)
    );
  }, [form]);

  const showToast = (msg, color = "#16a34a") => {
    const toast = document.createElement("div");
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background:
        color.startsWith("linear") || color.startsWith("#")
          ? color
          : `linear-gradient(135deg, ${color}, ${color})`,
      color: "#fff",
      padding: "10px 18px",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,.15)",
      fontWeight: 600,
      zIndex: 9999,
      transition: "opacity .3s ease",
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  };

  const setNested = (path, val) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = val;
      return next;
    });
  };

  const loadActive = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/suppliers/admin");
      setActive(Array.isArray(data) ? data : data.suppliers || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadArchived = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/suppliers/admin/archived");
      setArchived(Array.isArray(data) ? data : data.suppliers || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActive();
  }, []);

  useEffect(() => {
    if (tab === "archived" && archived.length === 0) loadArchived();
  }, [tab]);

  const create = async (e) => {
    e.preventDefault();
    if (!canSave) {
      setErr("Please fill all fields correctly (check Gmail, phone, and password format).");
      return;
    }
    try {
      const { data } = await api.post("/suppliers/admin", form);
      const supplier = data.supplier || data;
      setActive((p) => [supplier, ...p]);
      showToast(
        `Supplier "${form.companyName}" created successfully!`,
        "linear-gradient(90deg,#16a34a,#22c55e)"
      );
      resetForm();
      setShowModal(false);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    }
  };

  const doArchive = async (s) => {
    const ok = window.confirm(`Archive supplier "${s.companyName}"?`);
    if (!ok) return;
    try {
      await api.patch(`/suppliers/admin/${s._id}/archive`);
      setActive((l) => l.filter((x) => x._id !== s._id));
      setArchived((l) => [{ ...s, archived: true }, ...l]);
      showToast(`Supplier "${s.companyName}" archived.`, "#d97706");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const doActivate = async (s) => {
    const ok = window.confirm(`Activate supplier "${s.companyName}"?`);
    if (!ok) return;
    try {
      await api.patch(`/suppliers/admin/${s._id}/activate`);
      setArchived((l) => l.filter((x) => x._id !== s._id));
      setActive((l) => [{ ...s, archived: false }, ...l]);
      showToast(`Supplier "${s.companyName}" activated!`, "#16a34a");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const doDelete = async () => {
    const s = confirmDelete.supplier;
    if (!s) return;
    try {
      await api.delete(`/suppliers/admin/${s._id}`);
      setArchived((l) => l.filter((x) => x._id !== s._id));
      setConfirmDelete({ open: false, supplier: null });
      showToast(`Supplier "${s.companyName}" deleted successfully!`, "#b91c1c");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const openDetails = async (s) => {
    try {
      const { data } = await api.get(`/suppliers/admin/${s._id}`);
      setView({ open: true, data });
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
  const rows = tab === "active" ? active : archived;

  return (
    <div className="adminWrap">
      {/* Header: hero card + tabs left, compact add btn right */}
      <header className="adminHeader compact">
        <div className="pageHero container">
          <h1 className="pageTitle">Supplier Management</h1>
        </div>

        <div className="controlsRow tight container">
          <div className="adminTabs">
            <button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>
              Active
            </button>
            <button className={tab === "archived" ? "active" : ""} onClick={() => setTab("archived")}>
              Archived
            </button>
          </div>

          {tab === "active" && (
            <button className="primary xs" onClick={() => setShowModal(true)}>
              + Add Supplier
            </button>
          )}
        </div>
      </header>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="modalBackdrop">
          <div className="modalCard animateIn">
            <div className="modalHeader">
              <h3 className="modalTitle">Add New Supplier</h3>
              <button
                type="button"
                className="modalClose"
                aria-label="Close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            {err && <div className="error">{err}</div>}

            <form className="gridForm" onSubmit={create}>
              <label>User Name
                <input placeholder="Full name" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} required />
              </label>
              <label>Login Gmail
                <input type="email" placeholder="example@gmail.com" value={form.userEmail} onChange={(e) => setForm({ ...form, userEmail: e.target.value })} required />
              </label>
                {/* Password Field */}
                <label>Password
                  <div className="passwordField">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={form.tempPassword}
                      onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="eyeIcon"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeClosed /> : <EyeOpen />}
                    </button>
                  </div>
                </label>

              {/* Confirm Password Field */}
              <label>Confirm Password
                <div className="passwordField">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="eyeIcon"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeClosed /> : <EyeOpen />}
                  </button>
                </div>
              </label>


              {form.tempPassword && !passwordRegex.test(form.tempPassword) && (
                <div className="error" style={{ gridColumn: "1 / -1" }}>
                  Password must be at least 8 characters, include uppercase, lowercase, number, and symbol.
                </div>
              )}
              {form.confirmPassword && form.tempPassword !== form.confirmPassword && (
                <div className="error" style={{ gridColumn: "1 / -1" }}>
                  Passwords do not match.
                </div>
              )}

              <label>Company Name
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
              </label>
              <label>Address
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </label>
              <label>Branch
                <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} required />
              </label>
              <label>Company Gmail
                <input type="email" value={form.contactDetails.email} onChange={(e) => setNested("contactDetails.email", e.target.value.replace(/\s/g, "").toLowerCase())} required />
              </label>
              <label>Company Phone
                <input inputMode="numeric" maxLength={10} value={form.contactDetails.phone} onChange={(e) => setNested("contactDetails.phone", e.target.value.replace(/\D/g, ""))} required />
              </label>
              <label>Bank Account
                <input inputMode="numeric"  value={form.bankAccount.accountNumber} onChange={(e) => setNested("bankAccount.accountNumber", e.target.value)} required />
              </label>
              <label>Bank Name
                <input value={form.bankAccount.bankName} onChange={(e) => setNested("bankAccount.bankName", e.target.value)} required />
              </label>
              <label>Bank Branch
                <input value={form.bankAccount.bankBranch} onChange={(e) => setNested("bankAccount.bankBranch", e.target.value)} required />
              </label>
              <label>Contact Person
                <input value={form.contactPerson.name} onChange={(e) => setNested("contactPerson.name", e.target.value)} required />
              </label>
              <label>Designation
                <input value={form.contactPerson.designation} onChange={(e) => setNested("contactPerson.designation", e.target.value)} />
              </label>
              <label>Contact Phone
                <input inputMode="numeric" maxLength={10} value={form.contactPerson.phone} onChange={(e) => setNested("contactPerson.phone", e.target.value.replace(/\D/g, ""))} />
              </label>

              <div className="actionsRow">
                <button type="button" className="ghost soft" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary" disabled={!canSave}>Create Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete.open && (
        <div className="modalBackdrop">
          <div className="modalCard small animateIn">
            <div className="modalHeader">
              <h3 className="modalTitle">Confirm Deletion</h3>
              <button
                type="button"
                className="modalClose"
                aria-label="Close"
                onClick={() => setConfirmDelete({ open: false, supplier: null })}
              >
                ✕
              </button>
            </div>
            <p>Are you sure you want to permanently delete <strong>{confirmDelete.supplier?.companyName}</strong>?</p>
            <div className="actionsRow">
              <button className="ghost soft" onClick={() => setConfirmDelete({ open: false, supplier: null })}>Cancel</button>
              <button className="danger" onClick={doDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Table (panel width now matches header & tabs) */}
      <section className="panel container">
        <h3 className="panelTitle">{tab === "active" ? "Active Suppliers" : "Archived Suppliers"}</h3>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>SUP ID</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Login</th>
                <th>Status</th>
                <th>Created</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan="7">No suppliers found.</td></tr>}
              {!loading && rows.map((s) => (
                <tr key={s._id}>
                  <td>{s.supplierId || "—"}</td>
                  <td>{s.companyName}</td>
                  <td>
                    <div>{s?.contactPerson?.name || "—"}</div>
                    <small>{s?.contactDetails?.phone || "—"}</small>
                  </td>
                  <td>
                    <div>{s?.user?.email || s?.contactDetails?.email || "—"}</div>
                    <small>{s?.user?.name || "—"}</small>
                  </td>
                  <td>
                    <span className={s?.user?.isActive ? "badge ok" : "badge warn"}>
                      {s?.user?.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{fmtDate(s.createdAt)}</td>
                  <td className="right">
                    <button className="btnView" onClick={() => openDetails(s)}>View</button>
                    {tab === "active" ? (
                      <button className="danger" onClick={() => doArchive(s)}>Archive</button>
                    ) : (
                      <>
                        <button className="ghost" onClick={() => doActivate(s)}>Activate</button>
                        <button className="danger" onClick={() => setConfirmDelete({ open: true, supplier: s })}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {view.open && <DetailsModal data={view.data} onClose={() => setView({ open: false, data: null })} />}

      {/* Styles */}
      <style>{`
        :root {
          --orange:#FFA500; --blue:#0057B8;
          --bg:#f6f8fb; --card:#ffffff; --text:#1f2937; --muted:#6b7280;
          --border:#e5e7eb;
          --content: 1200px; /* unified content width */
        }

        .adminWrap{
          padding:16px 24px 24px;
          color:var(--text);
          background:var(--bg);
        }

        /* A simple utility to keep hero, tabs, and panel same width */
       .container{ 
          max-width: 95vw;          /* take almost full width */
          margin: 0 auto; 
          width: 100%;
          padding: 0 12px;          /* small side padding for breathing space */
        }


        /* Header like your Products page (hero card) */
        .adminHeader.compact{ display:flex; flex-direction:column; gap:12px; margin-bottom:10px; }
        .pageHero{
          background:#eaf3ff; border:1px solid #dbe7ff; border-radius:14px;
          padding:14px 16px; box-shadow:0 1px 0 rgba(255,255,255,.7) inset;
          width:100%;
        }
        .pageTitle{ margin:0; font-size:24px; line-height:1.25; font-weight:600; color:#0f172a; }

        /* Tabs + compact add button row */
        .controlsRow{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .controlsRow.tight{ gap:10px; }
        .adminTabs{
          display:inline-flex; background:#eef2f7; border:1px solid var(--border);
          border-radius:10px; padding:4px;
        }
        .adminTabs button{
          border:none; background:transparent; color:#374151; font-weight:500;
          padding:6px 12px; border-radius:8px; cursor:pointer;
        }
        .adminTabs button.active{
          background:linear-gradient(90deg,var(--orange),var(--blue));
          color:#fff; box-shadow:0 2px 6px rgba(0,0,0,.12);
        }

        /* Buttons */
        .primary{
          background:linear-gradient(90deg,var(--orange),var(--blue));
          color:#fff; border:0; border-radius:10px; font-weight:700;
          padding:10px 14px; cursor:pointer;
          display:inline-flex; align-items:center; justify-content:center;
          white-space:nowrap; width:auto; flex:none;
        }
        .primary.xs {
          background: linear-gradient(90deg, var(--orange), var(--blue));
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;             /* slightly bold but not too heavy */
          font-size: 14px;
          padding: 8px 14px;            /* reduced horizontal padding */
          width: auto;                  /* keeps button compact */
          min-width: unset;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .primary.xs:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
        }

        .ghost{
          background:#f3f4f6; border:1px solid var(--border); color:#374151;
          padding:8px 12px; border-radius:10px; cursor:pointer;
        }
        .danger{
          background:rgba(255,71,87,.08); border:1px solid rgba(255,71,87,.35);
          color:#b42318; padding:8px 12px; border-radius:10px; cursor:pointer;
        }
        .btnView{
          background:#fff; border:1px solid #cfe1f8; color:#0b63c7; 
          padding:8px 12px; border-radius:10px; cursor:pointer; margin-right:6px;
        }
        .btnView:hover{ background:#f3f8ff; }

        /* Panel & table — share same width via .container */
        .panel{
          background:var(--card);
          border:1px solid var(--border);
          border-radius:16px;
          padding:16px;
          box-shadow:0 8px 24px rgba(0,0,0,.06);
          margin:12px auto 0;
        }
        .panelTitle{ font-weight:500; margin:0 0 8px 0; color:#1f2937; }

        .tableWrap{ overflow:auto; border-radius:12px; }
        .table{
          width:100%; border-collapse:separate; border-spacing:0;
          background:#fff; border:1px solid var(--border); border-radius:12px; overflow:hidden;
        }
        .table thead th{
          background:#f8fafc; color:#556070; font-weight:600;
          padding:12px 10px; border-bottom:1px solid var(--border); text-align:left;
        }
        .table tbody td{
          padding:12px 10px; border-bottom:1px solid var(--border); vertical-align:middle; color:#1f2937;
        }
        .table tbody tr:nth-child(even){ background:#fcfdff; }
        .table tbody tr:hover { background:#f9fbff; }
        .table td.right, .table th.right{ text-align:right; }
        .badge{display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:700;}
        .badge.ok{background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.38);color:#03624a;}
        .badge.warn{background:rgba(245,158,11,.18);border:1px solid rgba(245,158,11,.4);color:#7a4d00;}
        .error{
          background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.28);
          color:#9f1239;padding:8px 10px;border-radius:10px;margin-bottom:6px;
        }

        /* Modals (light, scrollable, compact) */
        .modalBackdrop{ position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:1000; }
        .modalCard{
          background:#fff; color:#1a1a1a; border:1px solid var(--border); border-radius:16px;
          width:min(92vw, 600px);
          max-height:80vh; overflow:auto;
          padding:18px;
          box-shadow:0 18px 48px rgba(0,0,0,.18);
        }
        .modalCard.small{ width:min(92vw, 600px); }
        .modalHeader{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .modalTitle{ margin:0; font-weight:600; color:#2c2f36; }
        .modalClose{
          background:#f3f4f6; border:1px solid var(--border); color:#374151;
          border-radius:10px; padding:6px 10px; cursor:pointer;
        }
        .modalClose:hover{ background:#eceff3; }

        .gridForm{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-bottom:8px; }
        label{ display:flex; flex-direction:column; font-size:13px; font-weight:600; color:#374151; }
        label input{
          margin-top:4px; background:#fff; border:1px solid #d1d5db; color:#111827;
          padding:10px 12px; border-radius:10px; outline:none;
        }
        label input:focus{ border-color:var(--blue); box-shadow:0 0 0 2px rgba(0,87,184,.15); }
        label input::placeholder{ color:#6b7280; opacity:1; }
        label input:focus::placeholder{ color:#9ca3af; }

        .actionsRow{
          grid-column:1 / -1; display:flex; justify-content:flex-end; gap:10px; margin-top:12px;
        }
        .ghost.soft{
          background:#f7f8fa; border:1px solid var(--border); color:#374151;
          padding:10px 14px; border-radius:10px; cursor:pointer;
        }
        .ghost.soft:hover{ background:#eef1f6; }
        .passwordField {
          position: relative;
          display: flex;
          align-items: center;
        }

        .passwordField input {
          flex: 1;
          padding-right: 36px; /* space for icon */
        }

        .eyeIcon {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .eyeIcon:hover {
          color: var(--blue);
        }


        @media(max-width:1000px){ .gridForm{ grid-template-columns:1fr; } }

        /* Modal animation */
        .animateIn{ animation:fadeIn .22s ease-out, scaleIn .22s ease-out; }
        @keyframes fadeIn{ from{opacity:0;} to{opacity:1;} }
        @keyframes scaleIn{ from{transform:scale(.96);} to{transform:scale(1);} }
      `}</style>
    </div>
  );
}

/* View Modal — polished layout */
function DetailsModal({ data, onClose }) {
  if (!data) return null;
  const isActive = !!data?.user?.isActive;

  const Row = ({ k, v }) => (
    <div style={rowStyle}>
      <div style={labelStyle}>{k}</div>
      <div style={valueStyle}>{v}</div>
    </div>
  );

  return (
    <div style={backdrop}>
      <div style={card}>
        <div style={headerBar}>
          <h3 style={{ margin: 0, fontWeight: 650, color: "#243041" }}>Supplier Details</h3>
          <button type="button" aria-label="Close" onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={isActive ? pillOk : pillWarn}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Scrollable content */}
        <div style={scrollableContent}>
          <Row k="SUP ID" v={data.supplierId || "—"} />
          <Row k="Company" v={data.companyName} />
          <Row k="Address" v={data.address || "—"} />
          <Row k="Branch" v={data.branch || "—"} />
          <Row k="Login Name" v={data?.user?.name || "—"} />
          <Row k="Login Email" v={data?.user?.email || "—"} />
          <Row k="Contact Person" v={data?.contactPerson?.name || "—"} />
          <Row k="Contact Phone" v={data?.contactPerson?.phone || "—"} />
          <Row k="Company Gmail" v={data?.contactDetails?.email || "—"} />
          <Row k="Company Phone" v={data?.contactDetails?.phone || "—"} />
          <Row k="Bank Name" v={data?.bankAccount?.bankName || "—"} />
          <Row k="Bank Branch" v={data?.bankAccount?.bankBranch || "—"} />
          <Row k="Account Number" v={data?.bankAccount?.accountNumber || "—"} />
          <Row k="Created" v={new Date(data.createdAt).toLocaleString()} />
        </div>
      </div>
    </div>
  );
}

/* Compact, scrollable modal styles */
const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.35)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
  padding: "10px",
};

const card = {
  background: "#fff",
  color: "#1a1a1a",
  border: "1px solid rgba(0,0,0,.10)",
  borderRadius: 14,
  padding: "14px 18px",
  width: "min(90vw, 540px)",
  maxHeight: "75vh",
  overflowY: "auto",
  boxShadow: "0 10px 30px rgba(0,0,0,.15)",
};

const headerBar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
};

const closeBtn = {
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "3px 8px",
  cursor: "pointer",
  color: "#374151",
};

const scrollableContent = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  overflowY: "auto",
  paddingRight: 4,
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  alignItems: "center",
  gap: 8,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "6px 10px",
};

const labelStyle = { color: "#6b7280", fontSize: 13, fontWeight: 500 };
const valueStyle = { color: "#111827", fontSize: 13, fontWeight: 500 };

const pillBase = {
  display: "inline-block",
  padding: "3px 9px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};
const pillOk = {
  ...pillBase,
  background: "rgba(16,185,129,.18)",
  border: "1px solid rgba(16,185,129,.38)",
  color: "#03624a",
};
const pillWarn = {
  ...pillBase,
  background: "rgba(245,158,11,.18)",
  border: "1px solid rgba(245,158,11,.4)",
  color: "#7a4d00",
};
