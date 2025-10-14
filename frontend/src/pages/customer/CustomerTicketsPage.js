import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastProvider";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";




// Status color map (inline)
const STATUS_COLORS = {
  NEW: { text: "#3b82f6", border: "#3b82f655", bg: "rgba(59,130,246,.08)" },
  IN_PROGRESS: { text: "#06b6d4", border: "#06b6d455", bg: "rgba(6,182,212,.08)" },
  AWAITING_CUSTOMER_REPLY: { text: "#eab308", border: "#eab30855", bg: "rgba(234,179,8,.08)" },
  RESOLVED: { text: "#22c55e", border: "#22c55e55", bg: "rgba(34,197,94,.08)" },
  CLOSED: { text: "#9ca3af", border: "#9ca3af55", bg: "rgba(156,163,175,.08)" },
  UNDER_REVIEW: { text: "#f5c542", border: "#f5c54266", bg: "rgba(245,197,66,.12)" },
};
// Normalize "Awaiting Customer Reply" → "AWAITING_CUSTOMER_REPLY"
const normStatus = (s = "") => s.toUpperCase().replace(/\s+/g, "_");

export default function CustomerTicketsPage() {
  const [photoError, setPhotoError] = useState("");
  const [contactError, setContactError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // form state
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [fields, setFields] = useState({});
  const [photos, setPhotos] = useState([]);

  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const TYPES = [
    "Product Inquiry",
    "Product Complaint",
    "Delivery Delay",
    "Product Usage Guidelines",
    "Service Request",
  ];
  const STATUSES = [
    "NEW",
    "UNDER REVIEW",
    "AWAITING CUSTOMER REPLY",
    "IN PROGRESS",
    "RESOLVED",
    "CLOSED",
  ];

  const fetchTickets = async () => {
    try {
      setLoading(true);
      if (!user) {
        setTickets([]);
        return;
      }
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    let list = [...tickets];
    if (q) {
      list = list.filter(
        (t) =>
          (t.ticketNo || "").toLowerCase().includes(q) ||
          (t.type || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "ALL") list = list.filter((t) => t.status === statusFilter);
    if (typeFilter !== "ALL") list = list.filter((t) => t.type === typeFilter);
    setFiltered(list);
  }, [tickets, query, statusFilter, typeFilter]);

  const handleChange = (e) =>
    setFields({ ...fields, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
  const files = Array.from(e.target.files);

  if (files.length > 5) {
    setPhotoError("You can upload a maximum of 5 photos.");
    setPhotos(files.slice(0, 5)); // only keep first 5
  } else if (files.length < 1) {
    setPhotoError("Please upload at least 1 photo.");
    setPhotos([]);
  } else {
    setPhotoError("");
    setPhotos(files);
  }
};


  const handleCreateClick = () => {
    if (!user) {
      toast.info("Please log in to create a ticket. Redirecting to Home…");
      setTimeout(() => navigate("/"), 1500);
      return;
    }
    setShowModal(true);
  };

  // ---- Frontend validations added here ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please log in first to create a ticket.");
      return;
    }

 // Contact number: must be exactly 10 digits
const phone = String(contact || "").trim();
if (!/^\d{10}$/.test(phone)) {
  toast.error("Please enter a valid 10-digit contact number.");
  return;
}

    // Product Complaint: must have date (not future) + at least one photo
    if (type === "Product Complaint") {
      const hasDate = !!fields.purchase_date;
      const hasPhoto = photos && photos.length > 0;
      if (!hasDate) {
        toast.error("Please select the purchase date.");
        return;
      }
      const todayISO = new Date().toISOString().slice(0, 10);
      if (fields.purchase_date > todayISO) {
        toast.error("Purchase date cannot be in the future.");
        return;
      }
      if (!hasPhoto) {
        toast.error("Please attach at least one photo for complaints.");
        return;
      }

      if (photos.length < 1) {
        toast.error("Please attach at least one photo.");
        return;
      }
      if (photos.length > 5) {
        toast.error("You can upload a maximum of 5 photos.");
        return;
      }

    }

    // Delivery Delay: require delivery date
    if (type === "Delivery Delay" && !fields.delivery_date) {
      toast.error("Please select the delivery date.");
      return;
    }

    const fd = new FormData();
    fd.append("name", name);
    fd.append("contact_number", contact);
    fd.append("type", type);
    fd.append("fields", JSON.stringify(fields));
    photos.forEach((p) => fd.append("photos", p));

    try {
      await api.post("/tickets", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Ticket created successfully!");
      setShowModal(false);
      setType("");
      setName("");
      setContact("");
      setFields({});
      setPhotos([]);
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating ticket");
    }
  };

  /* ---------- Styles ---------- */
  const S = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg,#0a0f1c 0%,#0e172a 100%)",
      padding: "60px 20px",
      color: "#f1f5f9",
    },
    container: { maxWidth: 1180, margin: "0 auto" },
    glass: {
      background:
        "linear-gradient(135deg, rgba(37,99,235,.10), rgba(234,179,8,.10)), #0b1220",
      border: "1px solid #1f2a44",
      borderRadius: 24,
      boxShadow: "0 26px 70px rgba(0,0,0,.45)",
    },
    header: {
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "28px 24px",
    },
    title: { fontSize: 34, fontWeight: 900, marginBottom: 6 },
    subtitle: { color: "#9fb3d1", marginBottom: 0 },
    btnPrimary: {
      background: "linear-gradient(90deg,#2563eb,#fbbf24)",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 18px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 10px 30px rgba(37,99,235,.35)",
    },
    btnGhost: {
      background: "transparent",
      color: "#e5e7eb",
      border: "1px solid #334155",
      borderRadius: 10,
      padding: "10px 14px",
      cursor: "pointer",
    },
    card: { marginTop: 28, padding: 22 },
    sectionTitle: { fontWeight: 800, color: "#e5e7eb", margin: "0 0 12px 0" },
    controls: {
      display: "grid",
      gridTemplateColumns: "1fr 240px 240px",
      gap: 12,
      margin: "14px 0 18px",
    },
    input: {
      width: "100%",
      background: "#081023",
      color: "#e5e7eb",
      border: "1px solid #233055",
      borderRadius: 12,
      padding: "12px 14px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: 16,
    },
    tcard: {
      position: "relative",
      background:
        "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02))",
      border: "1px solid #263659",
      borderRadius: 18,
      padding: 16,
      boxShadow: "0 14px 40px rgba(0,0,0,.45)",
    },
    chip: {
      position: "absolute",
      top: 12,
      right: 12,
      fontSize: 12,
      padding: "6px 10px",
      borderRadius: 999,
      fontWeight: 800,
      letterSpacing: 0.2,
      background: "rgba(37,99,235,.18)",
      color: "#93c5fd",
      border: "1px solid #23407a",
    },
    ticketNo: { fontWeight: 900, fontSize: 16.5, color: "#e5e7eb" },
    meta: { color: "#9fb3d1", fontSize: 13, marginTop: 6 },
    divider: {
      height: 1,
      background: "linear-gradient(90deg,#23407a, transparent)",
      margin: "12px 0",
      opacity: 0.5,
    },
    badge: (status) => {
      const theme = STATUS_COLORS[normStatus(status)] || STATUS_COLORS.NEW;
      return {
        padding: "6px 10px",
        borderRadius: 10,
        fontWeight: 800,
        fontSize: 12,
        color: theme.text,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        };
   },
    viewLink: {
      display: "inline-block",
      marginTop: 10,
      color: "#60a5fa",
      fontWeight: 700,
      textDecoration: "none",
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: 16,
    },
    modal: {
      padding: 26,
      width: "100%",
      maxWidth: 650,
      borderRadius: 20,
      position: "relative",
    },
    close: {
      position: "absolute",
      top: 10,
      right: 14,
      color: "#9ca3af",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: 18,
    },
    modalTitle: { color: "#93c5fd", fontWeight: 900, marginBottom: 12 },
    form: { display: "flex", flexDirection: "column", gap: 10 },
    label: { color: "#9ca3af", marginTop: 4, fontSize: 14 },
    // skeleton
    skelCard: {
      borderRadius: 18,
      padding: 16,
      border: "1px solid #263659",
      background:
        "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
      overflow: "hidden",
      position: "relative",
    },
    skelBar: (h = 14, w = "70%") => ({
      height: h,
      width: w,
      borderRadius: 8,
      background:
        "linear-gradient(90deg, #102139 0%, #142a4a 50%, #102139 100%)",
      opacity: 0.65,
    }),
    shimmer: {
      content: '""',
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.08) 50%, transparent 100%)",
      transform: "translateX(-100%)",
      animation: "shimmer 1.4s infinite",
    },
  };

  /* ---------- Parallax glow for header ---------- */
  const headerRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tx = useSpring(useTransform(mx, [-200, 200], [-18, 18]), {
    stiffness: 120,
    damping: 18,
  });
  const ty = useSpring(useTransform(my, [-200, 200], [-12, 12]), {
    stiffness: 120,
    damping: 18,
  });

  const onHeaderMouseMove = (e) => {
    const rect = headerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mx.set(Math.max(-200, Math.min(200, x)));
    my.set(Math.max(-200, Math.min(200, y)));
  };

  /* ---------- Motion variants ---------- */
  const pageFade = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.35 } },
  };
  const headerSlide = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };
  const blockFade = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };
  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 240, damping: 20 },
    },
  };
  const overlayVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };
  const modalVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    },
    exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.16 } },
  };

  return (
    <motion.div style={S.page} variants={pageFade} initial="hidden" animate="show">
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>

      <div style={S.container}>
        {/* Header with parallax glow */}
        <motion.div
          style={{ ...S.glass, ...S.header }}
          variants={headerSlide}
          initial="hidden"
          animate="show"
          ref={headerRef}
          onMouseMove={onHeaderMouseMove}
        >
          {/* Parallax glow layers */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                width: 420,
                height: 420,
                left: "18%",
                top: "-20%",
                borderRadius: "50%",
                filter: "blur(60px)",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(37,99,235,.35), rgba(37,99,235,0) 60%)",
                x: tx,
                y: ty,
              }}
            />
            <motion.div
              style={{
                position: "absolute",
                width: 360,
                height: 360,
                right: "-6%",
                bottom: "-30%",
                borderRadius: "50%",
                filter: "blur(60px)",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(251,191,36,.28), rgba(251,191,36,0) 60%)",
                x: tx,
                y: ty,
              }}
            />
          </motion.div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={S.title}>My Support Tickets</h1>
            <p style={S.subtitle}>
              View, track, and manage your support requests easily.
            </p>
          </div>
          <button
            style={{ ...S.btnPrimary, position: "relative", zIndex: 1 }}
            onClick={handleCreateClick}
          >
            + Create Ticket
          </button>
        </motion.div>

        {/* Tickets block */}
        <motion.div
          style={{ ...S.glass, ...S.card }}
          variants={blockFade}
          initial="hidden"
          animate="show"
        >
          <h2 style={S.sectionTitle}>Your Tickets</h2>

          {!user ? (
            <div
              style={{
                textAlign: "center",
                color: "#9fb3d1",
                background: "rgba(255,255,255,.04)",
                border: "1px dashed #324262",
                borderRadius: 14,
                padding: 26,
              }}
            >
              You must log in to view your personalized ticket history.
            </div>
          ) : loading ? (
            <>
              <div style={S.controls}>
                <div style={S.input} />
                <div style={S.input} />
                <div style={S.input} />
              </div>
              <div style={S.grid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={S.skelCard}>
                    <div style={{ position: "absolute", inset: 0 }}>
                      <div style={S.shimmer} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ ...S.skelBar(20, 90), borderRadius: 999 }} />
                    </div>
                    <div style={{ height: 10 }} />
                    <div style={S.skelBar(16, "60%")} />
                    <div style={{ height: 10 }} />
                    <div style={S.skelBar(12, "40%")} />
                    <div style={{ height: 16 }} />
                    <div style={S.skelBar(10, "30%")} />
                    <div style={{ height: 14 }} />
                    <div style={S.skelBar(12, "50%")} />
                  </div>
                ))}
              </div>
            </>
          ) : tickets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#9fb3d1",
                background: "rgba(255,255,255,.04)",
                border: "1px dashed #324262",
                borderRadius: 14,
                padding: 26,
              }}
            >
              You haven’t created any tickets yet. Click “Create Ticket” to get
              started.
            </div>
          ) : (
            <>
              {/* Controls */}
              <div style={S.controls}>
                <input
                  style={S.input}
                  placeholder="Search by Ticket No / Type"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  style={S.input}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  style={S.input}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Animated grid */}
              <motion.div
                style={S.grid}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
                  },
                }}
                initial="hidden"
                animate="show"
              >
                {filtered.map((t) => (
                  <motion.div
                    key={t._id}
                    style={S.tcard}
                    variants={cardVariants}
                    whileHover={{
                      y: -3,
                      boxShadow: "0 22px 60px rgba(0,0,0,.55)",
                    }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <div style={S.chip}>{t.type}</div>
                    <div style={S.ticketNo}>{t.ticketNo}</div>
                    <div style={S.meta}>
                      Created: {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                    <div style={S.divider} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={S.badge(t.status)}>{t.status}</span>
                    </div>
                    <Link to={`/customer/tickets/${t._id}`} style={S.viewLink}>
                      View details →
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && user && (
            <motion.div
              key="overlay"
              style={S.modalOverlay}
              variants={overlayVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                key="modal"
                style={{ ...S.glass, ...S.modal }}
                variants={modalVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                <button style={S.close} onClick={() => setShowModal(false)}>
                  ✕
                </button>
                <h3 style={S.modalTitle}>Create New Ticket</h3>

                <form style={S.form} onSubmit={handleSubmit}>
                  <input
                    style={S.input}
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                <input
                  style={{
                    ...S.input,
                    borderColor: contactError ? "red" : "#233055",
                  }}
                  maxLength={10}
                  placeholder="Contact Number"
                  value={contact}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only digits
                    if (!/^\d*$/.test(value)) return;
                    setContact(value);

                    // Live validation
                    if (value.length > 0 && value.length !== 10) {
                      setContactError("Contact number must be exactly 10 digits.");
                    } else {
                      setContactError("");
                    }
                  }}
                  required
                />
                {contactError && (
                  <span style={{ color: "red", fontSize: 13, marginTop: -6 }}>
                    {contactError}
                  </span>
                )}

                  <select
                    style={S.input}
                    required
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setFields({});
                      setPhotos([]);
                    }}
                  >
                    <option value="">Select Ticket Type</option>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  {/* Dynamic fields */}
                  {type === "Product Inquiry" && (
                    <>
                      <input
                        style={S.input}
                        name="product_name"
                        placeholder="Product Name"
                        onChange={handleChange}
                      />
                      <input
                        style={S.input}
                        name="model"
                        placeholder="Model"
                        onChange={handleChange}
                      />
                      <textarea
                        style={S.input}
                        name="description"
                        placeholder="Description"
                        onChange={handleChange}
                      />
                    </>
                  )}

                  {type === "Product Complaint" && (
                    <>
                      <input
                        style={S.input}
                        name="product_name"
                        placeholder="Product Name"
                        onChange={handleChange}
                      />
                      <input
                        style={S.input}
                        name="order_no"
                        placeholder="Order Number"
                        onChange={handleChange}
                      />
                      <input
                        style={{
                          ...S.input,
                          position: "relative",
                          zIndex: 1000,          // ensures calendar appears above overlay
                          backgroundColor: "#081023",
                          colorScheme: "dark",   // ensures text visible in dark mode
                        }}
                        type="date"
                        name="purchase_date"
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={handleChange}
                        required
                      />

                      <textarea
                        style={S.input}
                        name="issue_description"
                        placeholder="Issue Description"
                        onChange={handleChange}
                      />
                      <label style={S.label}>Upload Photos</label>
                      <input
                        style={S.input}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </>
                  )}
                  {photoError && (
                      <span style={{ color: "red", fontSize: 13, marginTop: -6 }}>
                        {photoError}
                      </span>
                    )}


                  {type === "Delivery Delay" && (
                    <>
                      <input
                        style={S.input}
                        name="order_no"
                        placeholder="Order Number"
                        onChange={handleChange}
                      />
                      <input
                          style={{
                          ...S.input,
                          position: "relative",
                          zIndex: 1000,          // ensures calendar appears above overlay
                          backgroundColor: "#081023",
                          colorScheme: "dark",   // ensures text visible in dark mode
                        }}
                        name="delivery_date"
                        type="date"
                        min="2000-01-01"
                        onChange={handleChange}
                        required
                      />
                      <textarea
                        style={S.input}
                        name="description"
                        placeholder="Description"
                        onChange={handleChange}
                      />
                    </>
                  )}

                  {type === "Product Usage Guidelines" && (
                    <>
                      <input
                        style={S.input}
                        name="product_model"
                        placeholder="Product Model"
                        onChange={handleChange}
                      />
                      <textarea
                        style={S.input}
                        name="description"
                        placeholder="What guidance do you need?"
                        onChange={handleChange}
                      />
                    </>
                  )}

                  {type === "Service Request" && (
                    <>
                      <input
                        style={S.input}
                        name="product_name"
                        placeholder="Product Name"
                        onChange={handleChange}
                      />
                      <input
                        style={S.input}
                        name="model"
                        placeholder="Model"
                        onChange={handleChange}
                      />
                      <input
                        style={S.input}
                        name="warranty_status"
                        placeholder="Warranty Status"
                        onChange={handleChange}
                      />
                      <input
                        style={S.input}
                        name="preferred_service_center"
                        placeholder="Preferred Service Center"
                        onChange={handleChange}
                      />
                      <textarea
                        style={S.input}
                        name="description"
                        placeholder="Describe the issue / request"
                        onChange={handleChange}
                      />
                    </>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      type="button"
                      style={S.btnGhost}
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" style={S.btnPrimary}>
                      Submit
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
