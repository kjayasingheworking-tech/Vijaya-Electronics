import React, { useMemo, useState } from "react";
import RatingStars from "./RatingStars";
import { motion } from "framer-motion";

export default function FeedbackCard({
  feedback,
  currentUser,
  isTop = false,
  onEditFeedback,
  onDeleteFeedback,
  onEditComment,
  onDeleteComment,
  onAddComment,
  onUpvote,
  onRequireLogin,
}) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const isOwner = useMemo(
    () => currentUser?._id && feedback?.author?._id && currentUser._id === feedback.author._id,
    [currentUser, feedback]
  );
  const isAdmin = (currentUser?.role || "").toLowerCase() === "admin";
  const canManageFeedback = isOwner || isAdmin;

  const upvoteCount = feedback.upvotes?.length || 0;
  const hasUpvoted = useMemo(
    () => currentUser?._id && feedback.upvotes?.some(id => id === currentUser._id),
    [currentUser, feedback.upvotes]
  );

  const glowStyle = isTop
    ? { boxShadow: "0 10px 40px rgba(99,102,241,.35), 0 0 0 1px rgba(99,102,241,.25)" }
    : { boxShadow: "0 8px 26px rgba(2,6,23,.35)" };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!localStorage.getItem("token")) { onRequireLogin?.(); return; }
    setSubmitting(true);
    try {
      await onAddComment?.(feedback._id, comment.trim());
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    if (!localStorage.getItem("token")) { onRequireLogin?.(); return; }
    setUpvoting(true);
    try {
      await onUpvote?.(feedback._id);
    } finally {
      setUpvoting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      style={{
        background: "linear-gradient(180deg,#0b1220 0%, #0a1222 100%)",
        border: "1px solid #1f2a44",
        borderRadius: 18,
        padding: 18,
        color: "#e5e7eb",
        position: "relative",
        ...glowStyle,
      }}
    >
      {/* HEADER */}
      <div style={{ display: "grid", gap: 6 }}>
        {/* Row 1: stars + (Top Rated) ... kebab on far right */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <RatingStars value={feedback.rating} />
            {isTop && (
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.05 }}
                style={{
                  background: "linear-gradient(90deg,#22c55e,#34d399)",
                  color: "#052e1a",
                  fontWeight: 800,
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 9999,
                  boxShadow: "0 10px 24px rgba(34,197,94,.35)",
                  whiteSpace: "nowrap",
                }}
              >
                Most Discussed
              </motion.span>
            )}
            {/* Upvote button */}
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: hasUpvoted ? "linear-gradient(90deg,#6366f1,#7c3aed)" : "#0c1426",
                color: hasUpvoted ? "#fff" : "#93c5fd",
                border: hasUpvoted ? "none" : "1px solid #22304f",
                borderRadius: 20,
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: hasUpvoted ? "0 8px 20px rgba(99,102,241,.35)" : "none",
                opacity: upvoting ? 0.7 : 1,
              }}
              title={hasUpvoted ? "Remove upvote" : "Upvote this review"}
            >
              <span style={{ fontSize: 16 }}>{hasUpvoted ? "👍" : "👍🏻"}</span>
              <span>{upvoteCount}</span>
            </button>
          </div>

          {canManageFeedback && (
            <div style={{ marginLeft: "auto", position: "relative" }}>
              <button
                onClick={() => setMenuOpen((s) => !s)}
                aria-label="More actions"
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "1px solid #22304f",
                  background: "#0c1426", color: "#cbd5e1", cursor: "pointer",
                }}
              >
                ⋯
              </button>
              {menuOpen && (
                <div
                  onMouseLeave={() => setMenuOpen(false)}
                  style={{
                    position: "absolute",
                    top: 38,
                    right: 0,
                    background: "#0b1220",
                    border: "1px solid #22304f",
                    borderRadius: 12,
                    minWidth: 170,
                    boxShadow: "0 20px 50px rgba(0,0,0,.5)",
                    overflow: "hidden",
                    zIndex: 6,
                  }}
                >
                  <button onClick={() => { onEditFeedback?.(feedback); setMenuOpen(false); }} style={menuItem}>
                    Edit feedback
                  </button>
                  <button onClick={() => { onDeleteFeedback?.(feedback); setMenuOpen(false); }} style={{ ...menuItem, color: "#fca5a5" }}>
                    Delete feedback
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 2: author + date */}
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          by {feedback.author?.name || "Customer"} • {new Date(feedback.createdAt).toLocaleString()}
        </div>
      </div>

      {/* TITLE + BODY */}
      {feedback.title && (
        <h4 style={{ margin: "10px 0 8px", fontSize: 19, color: "#f3f4f6", letterSpacing: 0.2 }}>
          {feedback.title}
        </h4>
      )}
      {feedback.body && <p style={{ margin: 0, lineHeight: 1.6, color: "#cbd5e1" }}>{feedback.body}</p>}

      {/* COMMENTS */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
          {feedback.comments?.length || 0} comment{(feedback.comments?.length || 0) === 1 ? "" : "s"}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {(feedback.comments || []).map((c) => {
            const canManageComment = (currentUser?._id && currentUser._id === c.author?._id) || isAdmin;
            return (
              <div
                key={c._id}
                style={{
                  background: "linear-gradient(180deg,#0b1629,#0b1626)",
                  border: "1px solid #193055",
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "#93c5fd", marginBottom: 4, flex: 1 }}>
                    {c.author?.name || "User"} • {new Date(c.createdAt).toLocaleString()}
                  </div>
                  {canManageComment && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => onEditComment?.(feedback, c)} style={smallBtn} title="Edit comment">
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteComment?.(feedback, c)}
                        style={{ ...smallBtn, color: "#fca5a5", borderColor: "#3b2b2c" }}
                        title="Delete comment"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ color: "#dbeafe", fontSize: 14 }}>{c.text}</div>
              </div>
            );
          })}
        </div>

        <form onSubmit={submitComment} style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment…"
            style={{
              flex: 1,
              background: "#0a1020",
              color: "#e5e7eb",
              border: "1px solid #24314d",
              borderRadius: 12,
              padding: "12px 14px",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.02)",
            }}
          />
          <button
            disabled={submitting}
            style={{
              background: "linear-gradient(90deg,#6366f1,#7c3aed)",
              border: "none",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 16px",
              fontWeight: 800,
              cursor: "pointer",
              opacity: submitting ? 0.7 : 1,
              boxShadow: "0 12px 28px rgba(99,102,241,.35)",
            }}
          >
            Comment
          </button>
        </form>
      </div>
    </motion.div>
  );
}

const menuItem = {
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 14,
};

const smallBtn = {
  background: "transparent",
  color: "#93c5fd",
  border: "1px solid #203154",
  borderRadius: 8,
  padding: "4px 8px",
  cursor: "pointer",
};
