const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../config/mailer");
const { safeUploadToCloudinary } = require("../utils/cloudinaryUpload");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const sendVerificationEmail = async (user, rawToken) => {
  const appUrl = process.env.CLIENT_URL || "https://reporter-eight.vercel.app/";
  const link = `${appUrl}/verify-email/${rawToken}`;
  await sendEmail(
    user.email,
    "Verify your Civic Reporter account",
    `Hi ${user.name}, confirm this is your email by opening: ${link}\n\nThis link expires in 24 hours.`
  );
};

// @route  POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Email verification token (only meaningful if EMAIL_USER/EMAIL_PASS are configured -
    // see sendEmail, which no-ops silently otherwise). If email isn't configured we can't
    // verify anything, so the account is left unverified rather than falsely marked verified.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "citizen",
      verifyToken: hashedToken,
      verifyTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      sendVerificationEmail(user, rawToken);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/auth/verify/:token
const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyTokenExpires: { $gt: Date.now() },
    }).select("+verifyToken +verifyTokenExpires");

    if (!user) {
      return res.status(400).json({ message: "Verification link is invalid or expired" });
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ward: user.ward,
      address: user.address,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// @route  PUT /api/auth/profile
// @access Private
// Editable fields only - email, role, and verification status are never changed here
const updateProfile = async (req, res) => {
  try {
    const { name, phone, ward, address } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (ward !== undefined) user.ward = ward;
    if (address !== undefined) user.address = address;

    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ward: user.ward,
      address: user.address,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/auth/avatar
// @access Private
// Accepts multipart/form-data with a single "avatar" file field.
// If Cloudinary isn't configured, fails gracefully with a clear message
// instead of a raw "must supply api_key" error.
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file received" });
    }

    const result = await safeUploadToCloudinary(req.file.buffer, "civic-reporter/avatars");

    if (!result) {
      return res.status(503).json({
        message:
          "Image storage isn't configured yet (Cloudinary keys missing on the server) - profile photo upload is unavailable for now.",
      });
    }

    const user = await User.findById(req.user._id);
    user.avatarUrl = result.secure_url;
    await user.save();

    res.status(200).json({ avatarUrl: user.avatarUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/auth/password
// @access Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  updateAvatar,
  changePassword,
  verifyEmail,
};
