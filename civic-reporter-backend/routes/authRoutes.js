const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  updateAvatar,
  changePassword,
  verifyEmail,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyEmail);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/password", protect, changePassword);

module.exports = router;
