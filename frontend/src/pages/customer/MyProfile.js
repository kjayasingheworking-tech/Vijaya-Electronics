import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../components/ToastProvider"; 

export default function MyProfile() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "",
  });

  const [errors, setErrors] = useState({ 
    name: "",
    phone: "", 
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "" 
  });

  const clearClientAuth = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("electra_user");
      localStorage.removeItem("user");
    } catch (_) {}
  };

  const validatePhone = (digits) => {
    let err = "";
    if (digits.length === 0) err = "Phone is required";
    else if (digits.length !== 10) err = "Phone must be exactly 10 digits";
    setErrors((prev) => ({ ...prev, phone: err }));
    return err === "";
  };

  const validateRequired = (field, value, label) => {
    let err = "";
    if (!value || value.trim() === "") err = `${label} is required`;
    setErrors((prev) => ({ ...prev, [field]: err }));
    return err === "";
  };

  const validateForm = () => {
    const nameValid = validateRequired("name", form.name, "Name");
    const phoneValid = validatePhone(form.phone);
    const addressValid = validateRequired("addressLine1", form.addressLine1, "Address Line 1");
    const address2Valid = validateRequired("addressLine2", form.addressLine2, "Address Line 2");
    const cityValid = validateRequired("city", form.city, "City");
    const countryValid = validateRequired("country", form.country, "Country");
    return nameValid && phoneValid && addressValid && address2Valid && cityValid && countryValid;
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers/me");
      const p = res?.data?.profile;
      if (!p) throw new Error("Profile not found");
      const cleanPhone = (p.phone || "").replace(/\D/g, "").slice(0, 10);
      setForm({
        name: p.user?.name || "",
        email: p.user?.email || "",
        phone: cleanPhone,
        addressLine1: p.addressLine1 || "",
        addressLine2: p.addressLine2 || "",
        city: p.city || "",
        country: p.country || "",
      });
      validatePhone(cleanPhone);
    } catch (e) {
      const st = e?.response?.status;
      if (st === 401 || st === 403) {
        clearClientAuth();
        toast.error("Please login to view the profile");
        setTimeout(() => navigate("/", { replace: true }), 1200);
      } else {
        console.error("Load profile error:", e);
        toast.error(e?.response?.data?.message || "Error loading profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      toast.error("Please login to view the profile");
      setTimeout(() => navigate("/", { replace: true }), 900);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onPhoneChange = (e) => {
    if (!editMode) return;
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, phone: digits }));
    validatePhone(digits);
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        addressLine1: form.addressLine1 || "",
        addressLine2: form.addressLine2 || "",
        city: form.city || "",
        country: form.country || "",
      };
      const res = await api.put("/customers/me", payload);
      const p = res?.data?.profile;
      setForm((f) => ({
        ...f,
        name: p?.user?.name ?? f.name,
        phone: (p?.phone || f.phone).replace(/\D/g, "").slice(0, 10),
        addressLine1: p?.addressLine1 ?? f.addressLine1,
        addressLine2: p?.addressLine2 ?? f.addressLine2,
        city: p?.city ?? f.city,
        country: p?.country ?? f.country,
      }));
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (e2) {
      console.error("Save profile error:", e2);
      const errorMsg = e2?.response?.data?.message || "Error saving profile";
      
      // Check if it's a phone number duplicate error
      if (errorMsg.toLowerCase().includes("phone number already exists")) {
        setErrors((prev) => ({ ...prev, phone: "This phone number is already used by another account" }));
        toast.error("Phone number already exists. Please use a different number.");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    try {
      await api.delete("/customers/me");
      clearClientAuth();
      toast.info("Account deleted. Redirecting...");
      setTimeout(() => navigate("/", { replace: true }), 900);
    } catch (e) {
      console.error("Delete error:", e);
      toast.error(e?.response?.data?.message || "Could not delete account");
    }
  };

  const initials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || "U") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
  };

  const theme = { blue: "#1e6ee6", gold: "#f0b429" };

  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(180deg,#031122 0%, #061427 72%)",
      color: "#eaf2ff",
      paddingTop: 18,
      paddingBottom: 80,
      boxSizing: "border-box",
    },
    glow: {
      position: "fixed",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      background:
        "radial-gradient(900px 300px at 10% 12%, rgba(30,110,230,0.06), transparent)," +
        "radial-gradient(900px 300px at 92% 20%, rgba(240,180,41,0.03), transparent)",
    },
    container: { position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto", padding: 24 },
    hero: {
      width: "min(980px,100%)",
      margin: "12px auto 0",
      marginTop: -10,
      padding: "20px 22px",
      borderRadius: 14,
      background: "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
      border: "1px solid rgba(255,255,255,0.02)",
      backdropFilter: "blur(6px)",
      boxShadow: "0 18px 44px rgba(3,8,18,0.6), inset 0 0 30px rgba(30,110,230,0.02)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 18,
    },
    left: { display: "flex", alignItems: "center", gap: 14 },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 26,
      fontWeight: 800,
      color: "#071224",
      background: `linear-gradient(135deg, ${theme.blue}, ${theme.gold})`,
      boxShadow: "0 8px 24px rgba(30,110,230,0.12)",
    },
    title: { margin: 0, fontSize: 30, fontWeight: 800, color: "#f1fbff" },
    subtitle: { marginTop: 6, color: "rgba(230,240,255,0.75)", fontSize: 14 },
    editBtn: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "none",
      background: `linear-gradient(90deg, ${theme.blue}, ${theme.gold})`,
      color: "#071224",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 8px 26px rgba(30,110,230,0.15)",
    },
    card: {
      width: "min(980px,100%)",
      margin: "28px auto 0",
      borderRadius: 12,
      padding: 22,
      background: "linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.008))",
      boxShadow: "0 28px 70px rgba(3,8,20,0.72), inset 0 4px 22px rgba(20,40,80,0.02)",
      border: "1px solid rgba(255,255,255,0.02)",
    },
    sectionHead: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitle: { fontWeight: 800, fontSize: 15 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
    field: { display: "flex", flexDirection: "column" },
    label: { fontWeight: 800, marginBottom: 6, color: "rgba(235,245,255,0.9)" },
    input: {
      padding: "12px 14px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.03)",
      background: "linear-gradient(180deg, rgba(3,12,20,0.6), rgba(3,10,16,0.7))",
      color: "#e6f3ff",
      outline: "none",
      fontSize: 15,
    },
    inputError: {
      border: "1px solid rgba(255,120,120,0.6)",
      boxShadow: "0 0 0 3px rgba(255,120,120,0.15)",
    },
    errorText: { color: "#ff9898", fontSize: 12, marginTop: 6, fontWeight: 700 },
    error: { color: "#ff9898", fontSize: 12, marginTop: 4, fontWeight: 600 },
    row: { display: "flex", gap: 10, marginTop: 16, alignItems: "center" },
    primary: {
      background: "linear-gradient(90deg,#1e90ff,#2b7bff)",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      fontWeight: 800,
      boxShadow: "0 10px 26px rgba(43,123,255,0.18)",
    },
    ghost: {
      background: "transparent",
      color: "#cfe9ff",
      padding: "9px 12px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.04)",
      cursor: "pointer",
    },
    danger: {
      marginLeft: "auto",
      background: "linear-gradient(90deg,#ff7b7b,#ff4d4f)",
      color: "#fff",
      padding: "10px 16px",
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      fontWeight: 800,
      boxShadow: "0 10px 30px rgba(255,77,79,0.14)",
    },
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.glow} />
        <div style={styles.container}>
          <div style={styles.hero}>
            <div style={styles.left}>
              <div style={styles.avatar}>U</div>
              <div>
                <h2 style={styles.title}>My Profile</h2>
                <div style={styles.subtitle}>Loading profile…</div>
              </div>
            </div>
            <button style={{ ...styles.editBtn, opacity: 0.45 }} disabled>
              Edit
            </button>
          </div>
          <div style={styles.card}>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.container}>
        {/* HERO */}
        <div style={styles.hero}>
          <div style={styles.left}>
            <div style={styles.avatar}>{initials(form.name)}</div>
            <div>
              <h1 style={styles.title}>My Profile</h1>
              <div style={styles.subtitle}>Keep your details up to date.</div>
            </div>
          </div>
          {!editMode ? (
            <button style={styles.editBtn} onClick={() => setEditMode(true)}>
              Edit
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                form="profileForm"
                type="submit"
                style={styles.primary}
                disabled={saving || !!errors.name || !!errors.phone || !!errors.addressLine1 || !!errors.addressLine2 || !!errors.city || !!errors.country}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                style={styles.ghost}
                onClick={() => {
                  setEditMode(false);
                  load();
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* FORM */}
        <form id="profileForm" onSubmit={onSave} style={styles.card}>
          <div style={styles.sectionHead}>
            <div style={styles.sectionTitle}>Account details</div>
            <div style={{ color: "rgba(220,230,255,0.55)", fontSize: 13 }}>
              Email is read-only
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={(e) => {
                  onChange(e);
                  if (editMode) validateRequired("name", e.target.value, "Name");
                }}
                style={{
                  ...styles.input,
                  ...(errors.name ? styles.inputError : {}),
                }}
                disabled={!editMode}
                required
              />
              {errors.name && (
                <div style={styles.errorText}>{errors.name}</div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                name="email"
                value={form.email}
                style={styles.input}
                disabled
                readOnly
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Phone (10 digits) *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onPhoneChange}
                style={{
                  ...styles.input,
                  ...(errors.phone ? styles.inputError : {}),
                }}
                disabled={!editMode}
                placeholder="07XXXXXXXX"
                inputMode="numeric"
                maxLength={10}
              />
              {errors.phone && (
                <div style={styles.errorText}>{errors.phone}</div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>City *</label>
              <input
                name="city"
                value={form.city}
                onChange={(e) => {
                  onChange(e);
                  if (editMode) validateRequired("city", e.target.value, "City");
                }}
                style={{
                  ...styles.input,
                  ...(errors.city ? styles.inputError : {}),
                }}
                disabled={!editMode}
                required
              />
              {errors.city && (
                <div style={styles.errorText}>{errors.city}</div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Address Line 1 *</label>
              <input
                name="addressLine1"
                value={form.addressLine1}
                onChange={(e) => {
                  onChange(e);
                  if (editMode) validateRequired("addressLine1", e.target.value, "Address Line 1");
                }}
                style={{
                  ...styles.input,
                  ...(errors.addressLine1 ? styles.inputError : {}),
                }}
                disabled={!editMode}
              />
              {errors.addressLine1 && (
                <div style={styles.errorText}>{errors.addressLine1}</div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Address Line 2 *</label>
              <input
                name="addressLine2"
                value={form.addressLine2}
                onChange={(e) => {
                  onChange(e);
                  if (editMode) validateRequired("addressLine2", e.target.value, "Address Line 2");
                }}
                style={{
                  ...styles.input,
                  ...(errors.addressLine2 ? styles.inputError : {}),
                }}
                disabled={!editMode}
                required
              />
              {errors.addressLine2 && (
                <div style={styles.errorText}>{errors.addressLine2}</div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Country *</label>
              <input
                name="country"
                value={form.country}
                onChange={(e) => {
                  onChange(e);
                  if (editMode) validateRequired("country", e.target.value, "Country");
                }}
                style={{
                  ...styles.input,
                  ...(errors.country ? styles.inputError : {}),
                }}
                disabled={!editMode}
              />
              {errors.country && (
                <div style={styles.errorText}>{errors.country}</div>
              )}
            </div>
          </div>

          <div style={styles.row}>
            <button type="button" onClick={onDelete} style={styles.danger}>
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
