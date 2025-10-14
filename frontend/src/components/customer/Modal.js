import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Modal({ open, onClose, children, width = 480 }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) onClose?.();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(2,6,23,.6)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            style={{
              width: `min(92vw, ${width}px)`,
              background: "linear-gradient(180deg,#0b1220,#0b1326)",
              border: "1px solid #203154",
              borderRadius: 16,
              padding: 18,
              boxShadow: "0 30px 80px rgba(0,0,0,.6)",
              color: "#e5e7eb",
              position: "relative",
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid #233055",
                background: "#0a1324",
                color: "#cbd5e1",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, title, message, confirmText="Confirm", cancelText="Cancel", onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} width={420}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>{title}</div>
      <div style={{ color: "#9fb3d1", marginBottom: 16 }}>{message}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={btnGhost}> {cancelText} </button>
        <button onClick={() => { onConfirm?.(); onClose?.(); }} style={btnPrimaryDanger}> {confirmText} </button>
      </div>
    </Modal>
  );
}

export function EditFeedbackModal({ open, initial, onSave, onClose }) {
  const [form, setForm] = React.useState({ title: "", body: "", rating: 5 });

  React.useEffect(() => {
    if (open && initial) {
      setForm({
        title: initial.title || "",
        body: initial.body || "",
        rating: Number(initial.rating || 5),
      });
    }
  }, [open, initial]);

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Edit Feedback</div>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={label}>Rating</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="range"
              min="1"
              max="5"
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 800 }}>{form.rating}/5</span>
          </div>
        </div>
        <div>
          <div style={label}>Title (optional)</div>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={input}
            placeholder="Update title…"
          />
        </div>
        <div>
          <div style={label}>Feedback</div>
          <textarea
            rows={4}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            style={{ ...input, resize: "vertical" }}
            placeholder="Update your experience…"
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button
            onClick={() => onSave?.(form)}
            style={btnPrimary}
          >
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function EditCommentModal({ open, initialText="", onSave, onClose }) {
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    if (open) setText(initialText || "");
  }, [open, initialText]);

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Edit Comment</div>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ ...input, resize: "vertical" }}
        placeholder="Update your comment…"
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button onClick={() => onSave?.(text)} style={btnPrimary}>Save</button>
      </div>
    </Modal>
  );
}

// tiny styles
const label = { color: "#93c5fd", fontSize: 13, marginBottom: 6 };
const input = {
  width: "100%", background: "#081023", color: "#e5e7eb",
  border: "1px solid #233055", borderRadius: 12, padding: "12px 14px",
};
const btnGhost = {
  background: "transparent", color: "#e5e7eb", border: "1px solid #334155",
  borderRadius: 12, padding: "10px 14px", cursor: "pointer",
};
const btnPrimary = {
  background: "linear-gradient(90deg,#6366f1,#7c3aed)", border: "none", color: "#fff",
  borderRadius: 12, padding: "10px 16px", fontWeight: 900, cursor: "pointer",
  boxShadow: "0 10px 26px rgba(99,102,241,.35)",
};
const btnPrimaryDanger = {
  ...btnPrimary, background: "linear-gradient(90deg,#ef4444,#b91c1c)",
};
