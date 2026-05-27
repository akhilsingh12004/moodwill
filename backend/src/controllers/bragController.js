const BragLog              = require("../models/BragLog");

// ─── GET /api/brags ───────────────────────────────────────────────────────────
// Optional query params: ?category=Bug Fix&limit=20&page=1
exports.getBrags = async (req, res, next) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;

    const filter = { user: req.user._id };
    if (category) filter.category = category;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await BragLog.countDocuments(filter);
    const brags = await BragLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / limit),
      data:    brags,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/brags ──────────────────────────────────────────────────────────
exports.createBrag = async (req, res, next) => {
  try {
    const brag = await BragLog.create({
      user:        req.user._id,
      title:       req.body.title,
      description: req.body.description || "",
      category:    req.body.category    || "Milestone",
    });

    res.status(201).json({ success: true, data: brag });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/brags/:id ───────────────────────────────────────────────────────
exports.getBrag = async (req, res, next) => {
  try {
    const brag = await BragLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!brag) return res.status(404).json({ success: false, message: "Win not found." });
    res.status(200).json({ success: true, data: brag });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/brags/:id ─────────────────────────────────────────────────────
exports.updateBrag = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;

    const brag = await BragLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!brag) return res.status(404).json({ success: false, message: "Win not found." });
    res.status(200).json({ success: true, data: brag });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/brags/:id ────────────────────────────────────────────────────
exports.deleteBrag = async (req, res, next) => {
  try {
    const brag = await BragLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!brag) return res.status(404).json({ success: false, message: "Win not found." });
    res.status(200).json({ success: true, message: "Win deleted." });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/brags/stats ─────────────────────────────────────────────────────
// Returns count per category for the dashboard chart
exports.getBragStats = async (req, res, next) => {
  try {
    const stats = await BragLog.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    res.status(200).json({ success: true, total, data: stats });
  } catch (err) {
    next(err);
  }
};
