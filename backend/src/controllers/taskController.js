const Task                 = require("../models/Task");
const User                 = require("../models/User");

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (status)   filter.status   = status;

    // Find all matching tasks (not lean so we can call schema methods)
    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    let updatedAny = false;
    for (let task of tasks) {
      if (task.status === "Completed" && task.isDueToday()) {
        task.status = "Pending";
        await task.save();
        updatedAny = true;
      }
    }

    // Refetch in lean mode if any updates were made, to get correct status/filtering
    const finalTasks = updatedAny
      ? await Task.find(filter).sort({ createdAt: -1 }).lean()
      : tasks.map(t => t.toObject());

    res.status(200).json({ success: true, count: finalTasks.length, data: finalTasks });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      user:           req.user._id,
      title:          req.body.title,
      category:       req.body.category || "Chore",
      frequency:      req.body.frequency || "Daily",
      targetDuration: req.body.targetDuration || 600,
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/tasks/:id/complete ───────────────────────────────────────────
// Marks a task complete and updates lastCompletedAt
exports.completeTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { status: "Completed", lastCompletedAt: new Date() } },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    // If it's a social task, update the user's lastSocialActivity timestamp
    if (task.category === "Social") {
      await User.findByIdAndUpdate(req.user._id, { lastSocialActivity: new Date() });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
exports.updateTask = async (req, res, next) => {
  try {
    const { title, category, frequency, targetDuration, status } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (frequency !== undefined) updates.frequency = frequency;
    if (targetDuration !== undefined) updates.targetDuration = targetDuration;
    if (status !== undefined) updates.status = status;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    res.status(200).json({ success: true, message: "Task deleted." });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/tasks/daily-reset ──────────────────────────────────────────────
// Returns the 4 basic-needs items for today, seeding them if they do not exist
exports.getDailyReset = async (req, res, next) => {
  try {
    const defaultTitles = ["Sleep", "Eat", "Water", "Sun"];
    let needs = await Task.find({
      user: req.user._id,
      category: "Health",
      frequency: "Daily",
    });

    // Check if any completed tasks are due today (i.e. completed on a previous day)
    for (let task of needs) {
      if (task.status === "Completed" && task.isDueToday()) {
        task.status = "Pending";
        await task.save();
      }
    }

    const existingTitles = needs.map(t => t.title.toLowerCase());
    const toCreate = defaultTitles.filter(t => !existingTitles.includes(t.toLowerCase()));

    if (toCreate.length > 0) {
      const created = await Task.insertMany(
        toCreate.map(title => ({
          user: req.user._id,
          title,
          category: "Health",
          frequency: "Daily",
          status: "Pending",
        }))
      );
      needs = [...needs, ...created];
    }

    // Convert to standard JS objects for response
    const finalNeeds = needs.map(t => t.toObject ? t.toObject() : t);

    res.status(200).json({ success: true, data: finalNeeds });
  } catch (err) {
    next(err);
  }
};
