import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import RatingStars from "../../components/customer/RatingStars";
import FeedbackCard from "../../components/customer/FeedbackCard";
import { useAuth } from "../../context/AuthContext";
import { Modal, ConfirmDialog, EditFeedbackModal, EditCommentModal } from "../../components/customer/Modal";
import { useToast } from "../../components/ToastProvider";


export default function AboutUs() {
  const { user: currentUser } = useAuth() || {};
  const isAuthed = !!localStorage.getItem("token");
  const toast = useToast();

  // list data
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // create feedback
  const [form, setForm] = useState({ rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // login prompt
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // edit/delete modals state
  const [editFeedback, setEditFeedback] = useState(null); // feedback doc
  const [deleteFeedback, setDeleteFeedback] = useState(null); // feedback doc
  const [editComment, setEditComment] = useState(null); // { fid, cid, text }
  const [deleteComment, setDeleteComment] = useState(null); // { fid, cid }

  const pages = Math.ceil(total / pageSize) || 1;

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/feedback?page=${p}&pageSize=${pageSize}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load feedback.");

    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load().catch(console.error); }, []);

  const topRated = useMemo(() => {
    const sorted = [...items].sort((a, b) => (b.rating - a.rating) || (new Date(b.createdAt) - new Date(a.createdAt)));
    return sorted.slice(0, 3);
  }, [items]);

  // create
  const onCreateFeedback = async (e) => {
    e.preventDefault();
    setErr("");
    if (!isAuthed) { setShowLoginPrompt(true); return; }
    setSubmitting(true);
    try {
      await api.post("/feedback", form);
      setForm({ rating: 5, title: "", body: "" });
      await load(1);
      toast.success("Feedback submitted successfully!");
      document.getElementById("feedback-list")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      setErr(error?.response?.data?.message || error.message);
      toast.error("Failed to submit feedback.");

    } finally {
      setSubmitting(false);
    }
  };

  // comments
  const onAddComment = async (fid, text) => {
    if (!isAuthed) { setShowLoginPrompt(true); return; }
    await api.post(`/feedback/${fid}/comments`, { text });
    await load(page);
    toast.success("Comment added successfully!");

  };

  // open modals from cards
  const handleEditFeedback = (fb) => setEditFeedback(fb);
  const handleDeleteFeedback = (fb) => setDeleteFeedback({ id: fb._id });

  const handleEditComment = (fb, c) => setEditComment({ fid: fb._id, cid: c._id, text: c.text });
  const handleDeleteComment = (fb, c) => setDeleteComment({ fid: fb._id, cid: c._id });

  // save from modals
  const saveFeedback = async (payload) => {
    if (!isAuthed) { setShowLoginPrompt(true); return; }
    await api.patch(`/feedback/${editFeedback._id}`, payload);
    setEditFeedback(null);
    await load(page);
    toast.success("Feedback updated successfully!");

  };
  const doDeleteFeedback = async () => {
    if (!isAuthed) { setShowLoginPrompt(true); return; }
    await api.delete(`/feedback/${deleteFeedback.id}`);
    setDeleteFeedback(null);
    await load(page);
    toast.info("Feedback deleted.");

  };
  const saveComment = async (text) => {
    if (!isAuthed) { setShowLoginPrompt(true); return; }
    const { fid, cid } = editComment;
    await api.patch(`/feedback/${fid}/comments/${cid}`, { text });
    setEditComment(null);
    await load(page);
    toast.success("Comment updated successfully!");

  };
  const doDeleteComment = async () => {
    if (!isAuthed) { setShowLoginPrompt(true); return; }
    const { fid, cid } = deleteComment;
    await api.delete(`/feedback/${fid}/comments/${cid}`);
    setDeleteComment(null);
    await load(page);
    toast.info("Comment deleted.");

  };

  // layout helpers
  const container = { position: "relative", maxWidth: 1180, margin: "0 auto", padding: "24px 18px 80px", zIndex: 1 };
  const sectionTitle = { color: "#e5e7eb", fontWeight: 900, fontSize: 22, letterSpacing: 0.2, marginBottom: 12 };

  return (
    <>
      {/* backdrop */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0,
        background: "linear-gradient(180deg,#0a0f1c 0%, #0b1220 30%, #0c1424 60%, #0e172a 100%)" }} />
      <div aria-hidden style={{ position: "fixed", left:0, right:0, top:0, height:220, zIndex:0,
        background: "linear-gradient(135deg, rgba(37,99,235,.18), rgba(234,179,8,.18))", filter:"blur(40px)", opacity:.8 }} />

      <div style={container}>
        {/* HERO */}
        <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,.25), rgba(234,179,8,.25))," +
              "radial-gradient(1200px 500px at 20% -20%, rgba(99,102,241,.18), transparent)," +
              "#070b17",
            border: "1px solid #1f2a44", borderRadius: 26, padding: "36px 26px",
            position:"relative", boxShadow:"0 30px 80px rgba(0,0,0,.45)"}}>
          <motion.h1 initial={{ scale:.98 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:140, damping:14 }}
            style={{ color:"#f1f5f9", margin:0, fontSize:40, fontWeight:900, letterSpacing:.3 }}>
            About Us
          </motion.h1>
          <p style={{ color:"#9fb3d1", marginTop:12, maxWidth:860, lineHeight:1.7, fontSize:16 }}>
            We’re dedicated to delivering a delightful customer experience. From discovery to delivery, our team focuses on
            quality, transparency, and service.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14, marginTop:18 }}>
            {[
              { title: "Quality First", text: "Curated products with strict quality checks." },
              { title: "Trusted Support", text: "Friendly support, clear policies, fast responses." },
              { title: "Community Driven", text: "We listen to feedback and evolve together." },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true, margin:"-40px" }} transition={{ delay:.06*i }}
                style={{ background:"linear-gradient(180deg,#0b1220,#0b1322)", border:"1px solid #1f2a44",
                  borderRadius:16, padding:16, boxShadow:"0 14px 40px rgba(0,0,0,.35)" }}>
                <div style={{ color:"#93c5fd", fontWeight:800, fontSize:15 }}>{f.title}</div>
                <div style={{ color:"#cbd5e1", marginTop:6 }}>{f.text}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* TOP RATED */}
        <div style={{ marginTop: 34 }}>
          <div style={sectionTitle}>🌟 Top Rated Feedback</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:16 }}>
            {topRated.map((fb) => (
              <FeedbackCard
                key={fb._id}
                feedback={fb}
                currentUser={currentUser}
                onAddComment={onAddComment}
                onEditFeedback={handleEditFeedback}
                onDeleteFeedback={handleDeleteFeedback}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onRequireLogin={() => setShowLoginPrompt(true)}
                isTop
              />
            ))}
            {topRated.length === 0 && <div style={{ color:"#93c5fd" }}>No feedback yet — be the first!</div>}
          </div>
        </div>

        {/* LEAVE FEEDBACK */}
        <motion.div id="leave-feedback" initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ marginTop:34, background:"linear-gradient(180deg,#0b1220,#0b1324)", border:"1px solid #1f2a44",
            borderRadius:20, padding:22, boxShadow:"0 18px 50px rgba(0,0,0,.45)" }}>
          <div style={{ color:"#e5e7eb", fontWeight:900, marginBottom:10, fontSize:18 }}>Leave Your Feedback</div>
          <form onSubmit={onCreateFeedback} style={{ display:"grid", gap:12 }}>
            <div>
              <div style={{ color:"#93c5fd", fontSize:13, marginBottom:6 }}>Rating</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input type="range" min="1" max="5" value={form.rating}
                  onChange={(e)=>setForm((f)=>({...f, rating:Number(e.target.value)}))} style={{ flex:1 }} />
                <RatingStars value={form.rating} />
              </div>
            </div>
            <div>
              <div style={{ color:"#93c5fd", fontSize:13, marginBottom:6 }}>Title (optional)</div>
              <input value={form.title} onChange={(e)=>setForm((f)=>({...f, title:e.target.value}))}
                placeholder="e.g., Loved the delivery speed!" style={input} />
            </div>
            <div>
              <div style={{ color:"#93c5fd", fontSize:13, marginBottom:6 }}>Feedback</div>
              <textarea rows={4} value={form.body} onChange={(e)=>setForm((f)=>({...f, body:e.target.value}))}
                placeholder="Tell others about your experience…" style={{ ...input, resize:"vertical" }} />
            </div>
            {err && <div style={{ color:"#fca5a5" }}>{err}</div>}
            <div><button disabled={submitting} style={btnPrimary}>{submitting ? "Submitting…" : "Submit Feedback"}</button></div>
            <div style={{ color:"#9ca3af", fontSize:12 }}>Note: You must be logged in to submit feedback or comments.</div>
          </form>
        </motion.div>

        {/* ALL FEEDBACK */}
        <div id="feedback-list" style={{ marginTop: 36 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={sectionTitle}>All Feedback</div>
            <div style={{ color:"#9ca3af", fontSize:12 }}>Page {page} of {pages}</div>
          </div>

          {loading ? (
            <div style={{ color:"#93c5fd" }}>Loading…</div>
          ) : (
            <div style={{ display:"grid", gap:16 }}>
              {items.map((fb) => (
                <FeedbackCard
                  key={fb._id}
                  feedback={fb}
                  currentUser={currentUser}
                  onAddComment={onAddComment}
                  onEditFeedback={handleEditFeedback}
                  onDeleteFeedback={handleDeleteFeedback}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                  onRequireLogin={() => setShowLoginPrompt(true)}
                />
              ))}
              {items.length === 0 && <div style={{ color:"#93c5fd" }}>No feedback found.</div>}
            </div>
          )}

          {pages > 1 && (
            <div style={{ marginTop:18, display:"flex", gap:10, justifyContent:"center" }}>
              <button disabled={page<=1} onClick={()=>load(page-1)} style={btnGhost}>Prev</button>
              <button disabled={page>=pages} onClick={()=>load(page+1)} style={btnGhost}>Next</button>
            </div>
          )}
        </div>

        {/* LOGIN PROMPT */}
        <Modal open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)}>
          <div style={{ fontWeight:900, fontSize:18, marginBottom:8 }}>Please log in to continue</div>
          <div style={{ color:"#9fb3d1", marginBottom:16 }}>You need to be signed in to post feedback or comments.</div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setShowLoginPrompt(false)} style={btnGhost}>Cancel</button>
            <button onClick={() => (window.location.href="/")} style={btnPrimary}>Go to Login</button>
          </div>
        </Modal>

        {/* EDIT FEEDBACK */}
        <EditFeedbackModal
          open={!!editFeedback}
          initial={editFeedback}
          onSave={saveFeedback}
          onClose={() => setEditFeedback(null)}
        />

        {/* DELETE FEEDBACK */}
        <ConfirmDialog
          open={!!deleteFeedback}
          title="Delete feedback?"
          message="This will permanently remove your feedback and its comments."
          confirmText="Delete"
          onConfirm={doDeleteFeedback}
          onClose={() => setDeleteFeedback(null)}
        />

        {/* EDIT COMMENT */}
        <EditCommentModal
          open={!!editComment}
          initialText={editComment?.text}
          onSave={saveComment}
          onClose={() => setEditComment(null)}
        />

        {/* DELETE COMMENT */}
        <ConfirmDialog
          open={!!deleteComment}
          title="Delete comment?"
          message="This will permanently remove your comment."
          confirmText="Delete"
          onConfirm={doDeleteComment}
          onClose={() => setDeleteComment(null)}
        />
      </div>
    </>
  );
}

const input = {
  width: "100%", background: "#081023", color: "#e5e7eb",
  border: "1px solid #233055", borderRadius: 12, padding: "12px 14px",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.02)",
};
const btnPrimary = {
  background: "linear-gradient(90deg,#6366f1,#7c3aed)", border: "none", color: "#fff",
  borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer",
  boxShadow: "0 16px 34px rgba(99,102,241,.35)",
};
const btnGhost = {
  background: "transparent", color: "#e5e7eb", border: "1px solid #334155",
  borderRadius: 12, padding: "10px 14px", cursor: "pointer",
};
