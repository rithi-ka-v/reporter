const multer = require("multer");

// Store file in memory as a buffer, then push to Cloudinary manually
// (avoids version conflicts between multer-storage-cloudinary and cloudinary v2)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
