const Issue = require("../models/Issue");
const sendEmail = require("../config/mailer");
const { safeUploadToCloudinary } = require("../utils/cloudinaryUpload");

const USER_PUBLIC_FIELDS = "name ward address avatarUrl isVerified";

// @route  POST /api/issues
// @access Private (logged-in users)
const createIssue = async (req, res) => {
  try {
    const { title, description, category, longitude, latitude, address, isEmergency } = req.body;

    if (!title || !description || !category || !longitude || !latitude) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    // ---- DUPLICATE DETECTION ----
    // Same category, unresolved, within 50 meters -> merge instead of creating a new issue
    const duplicate = await Issue.findOne({
      category,
      status: { $ne: "resolved" },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 50,
        },
      },
    });

    if (duplicate) {
      const userId = req.user._id.toString();
      const alreadyAffected =
        duplicate.alsoAffectedBy.some((id) => id.toString() === userId) ||
        duplicate.reportedBy.toString() === userId;

      if (!alreadyAffected) {
        duplicate.alsoAffectedBy.push(req.user._id);
        await duplicate.save();
      }

      return res.status(200).json({
        message: "Similar issue already reported nearby. You've been added as an affected user.",
        issue: duplicate,
        isDuplicate: true,
      });
    }
    // ---- END DUPLICATE DETECTION ----

    // Photo upload never blocks issue creation - if Cloudinary isn't configured
    // or the upload fails, the issue is still saved, just without a photo.
    let photoUrl = "";
    if (req.file) {
      const result = await safeUploadToCloudinary(req.file.buffer, "civic-reporter/issues");
      if (result) photoUrl = result.secure_url;
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      photoUrl,
      location: { type: "Point", coordinates: [lng, lat] },
      address: address || "",
      reportedBy: req.user._id,
      isEmergency: isEmergency === "true" || isEmergency === true,
      statusHistory: [{ status: "pending", note: "Issue reported" }],
    });

    // Fire-and-forget emergency alert (does not block the response)
    if (issue.isEmergency) {
      sendEmail(
        process.env.EMAIL_USER, // replace with real authority email in production
        `EMERGENCY reported: ${issue.category}`,
        `Emergency issue "${issue.title}" reported at ${issue.address || "unknown location"}.`
      );
    }

    res.status(201).json({ issue, isDuplicate: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/issues
// @access Public
// Query params: ?category=pothole&status=pending&isEmergency=true&sortBy=upvotes
const getIssues = async (req, res) => {
  try {
    const { category, status, isEmergency, sortBy } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (isEmergency) filter.isEmergency = isEmergency === "true";

    if (sortBy === "upvotes") {
      const issues = await Issue.aggregate([
        { $match: filter },
        { $addFields: { upvoteCount: { $size: "$upvotes" } } },
        { $sort: { upvoteCount: -1 } },
      ]);
      return res.status(200).json(issues);
    }

    const issues = await Issue.find(filter)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/issues/near?lat=..&lng=..&radius=2000
// @access Public
const getNearbyIssues = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) || 2000, // default 2km
        },
      },
    }).populate("reportedBy", "name email");

    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/issues/:id
// @access Public
// Populates upvotes and comment authors with public profile info (name, ward,
// address, avatar) so the UI can show who upvoted/commented and roughly where they are.
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("reportedBy", "name email ward")
      .populate("upvotes", USER_PUBLIC_FIELDS)
      .populate("alsoAffectedBy", USER_PUBLIC_FIELDS)
      .populate("comments.postedBy", USER_PUBLIC_FIELDS);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.status(200).json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/issues/:id/upvote
// @access Private
const upvoteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const userId = req.user._id.toString();
    const alreadyUpvoted = issue.upvotes.some((id) => id.toString() === userId);

    if (alreadyUpvoted) {
      issue.upvotes = issue.upvotes.filter((id) => id.toString() !== userId);
    } else {
      issue.upvotes.push(req.user._id);
    }
    await issue.save();

    const updated = await Issue.findById(issue._id).populate("upvotes", USER_PUBLIC_FIELDS);

    res.status(200).json({
      message: alreadyUpvoted ? "Upvote removed" : "Issue upvoted",
      upvoteCount: updated.upvotes.length,
      upvotes: updated.upvotes,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/issues/:id/comments
// @access Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.comments.push({ text: text.trim(), postedBy: req.user._id });
    await issue.save();

    const updated = await Issue.findById(issue._id).populate("comments.postedBy", USER_PUBLIC_FIELDS);

    res.status(201).json({ comments: updated.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/issues/:id/comments/:commentId/like
// @access Private
const toggleCommentLike = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const comment = issue.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = comment.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
      comment.likes.push(req.user._id);
    }

    await issue.save();

    res.status(200).json({ commentId: comment._id, likeCount: comment.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/issues/:id/status
// @access Private (admin only)
const updateIssueStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["pending", "in-progress", "resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const issue = await Issue.findById(req.params.id).populate("reportedBy", "name email");
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.status = status;
    issue.statusHistory.push({ status, note: note || "" });

    if (status === "resolved") {
      issue.isEscalated = false;
    }

    await issue.save();

    // Notify the citizen who reported it
    if (issue.reportedBy?.email) {
      sendEmail(
        issue.reportedBy.email,
        `Your issue "${issue.title}" is now ${status}`,
        `Status update: ${status}${note ? `\nNote: ${note}` : ""}`
      );
    }

    res.status(200).json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/issues/mine
// @access Private
// Issues the logged-in user reported, plus ones they're marked as "also affected by"
const getMyIssues = async (req, res) => {
  try {
    const userId = req.user._id;

    const reported = await Issue.find({ reportedBy: userId })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    const affected = await Issue.find({ alsoAffectedBy: userId })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ reported, affected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/issues/admin/all
// @access Private (admin only) - includes escalated flag sorting
const getAdminIssues = async (req, res) => {
  try {
    const issues = await Issue.find({})
      .populate("reportedBy", "name email")
      .sort({ isEmergency: -1, isEscalated: -1, createdAt: -1 });

    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getNearbyIssues,
  getIssueById,
  upvoteIssue,
  addComment,
  toggleCommentLike,
  updateIssueStatus,
  getAdminIssues,
  getMyIssues,
};
