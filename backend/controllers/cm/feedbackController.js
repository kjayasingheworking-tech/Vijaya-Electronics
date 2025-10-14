const Feedback = require("../../models/cm/Feedback");

// POST /api/feedback
exports.createFeedback = async (req, res) => {
  try {
    const { rating, title, body } = req.body;
    const fb = await Feedback.create({
      author: req.user._id,
      rating,
      title,
      body,
      targetType: "company",
    });
    const populated = await Feedback.findById(fb._id)
      .populate("author", "name email role");
    res.status(201).json({ feedback: populated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/feedback
exports.listFeedback = async (req, res) => {
  try {
    const { author, minRating, page = 1, pageSize = 10 } = req.query;
    const filter = { targetType: "company" };
    if (author) filter.author = author;
    if (minRating) filter.rating = { $gte: Number(minRating) };

    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("author", "name email role")
        .populate("comments.author", "name email role"),
      Feedback.countDocuments(filter),
    ]);

    res.json({
      items,
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      pages: Math.ceil(total / Number(pageSize)),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/feedback/:id
exports.getFeedback = async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id)
      .populate("author", "name email role")
      .populate("comments.author", "name email role");
    if (!fb) return res.status(404).json({ message: "Feedback not found" });
    res.json({ feedback: fb });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH /api/feedback/:id
exports.updateFeedback = async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });
    if (String(fb.author) !== String(req.user._id))
      return res.status(403).json({ message: "Forbidden" });

    const { rating, title, body } = req.body;
    if (rating !== undefined) fb.rating = rating;
    if (title !== undefined) fb.title = title;
    if (body !== undefined) fb.body = body;
    await fb.save();

    const populated = await Feedback.findById(fb._id)
      .populate("author", "name email role")
      .populate("comments.author", "name email role");
    res.json({ feedback: populated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE /api/feedback/:id
exports.deleteFeedback = async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });

    const isOwner = String(fb.author) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    await fb.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST /api/feedback/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });

    fb.comments.push({ author: req.user._id, text });
    await fb.save();

    const populated = await Feedback.findById(fb._id)
      .populate("author", "name email role")
      .populate("comments.author", "name email role");
    res.status(201).json({ feedback: populated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH /api/feedback/:id/comments/:commentId
exports.updateComment = async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });

    const comment = fb.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner = String(comment.author) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    if (req.body.text !== undefined) comment.text = req.body.text;
    await fb.save();

    const populated = await Feedback.findById(fb._id)
      .populate("author", "name email role")
      .populate("comments.author", "name email role");
    res.json({ feedback: populated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE /api/feedback/:id/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });

    const comment = fb.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner = String(comment.author) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    comment.deleteOne();
    await fb.save();

    res.json({ message: "Comment deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
