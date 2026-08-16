const express = require("express");
const {
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
} = require("../controllers/issueController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// Public
router.get("/", getIssues);
router.get("/near", getNearbyIssues);

// Admin (must come before "/:id" so "admin" isn't treated as an ID)
router.get("/admin/all", protect, adminOnly, getAdminIssues);
router.get("/mine", protect, getMyIssues);

// Public (dynamic id route)
router.get("/:id", getIssueById);

// Private
router.post("/", protect, upload.single("photo"), createIssue);
router.put("/:id/upvote", protect, upvoteIssue);
router.post("/:id/comments", protect, addComment);
router.put("/:id/comments/:commentId/like", protect, toggleCommentLike);

// Admin only
router.put("/:id/status", protect, adminOnly, updateIssueStatus);

module.exports = router;
