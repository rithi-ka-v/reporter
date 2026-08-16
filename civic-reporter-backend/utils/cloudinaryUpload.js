const cloudinary = require("../config/cloudinary");

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

// Uploads an in-memory file buffer to Cloudinary.
// Never throws — if Cloudinary isn't configured or the upload fails,
// it logs a warning and returns null so the calling request can continue
// (e.g. an issue/profile still gets created, just without a photo).
const safeUploadToCloudinary = (fileBuffer, folder = "civic-reporter") => {
  return new Promise((resolve) => {
    if (!isCloudinaryConfigured()) {
      console.warn(
        "Cloudinary is not configured (missing CLOUDINARY_* env vars) — skipping photo upload."
      );
      return resolve(null);
    }

    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        console.warn("Cloudinary upload failed, continuing without photo:", error.message);
        return resolve(null);
      }
      resolve(result);
    });
    stream.end(fileBuffer);
  });
};

module.exports = { safeUploadToCloudinary, isCloudinaryConfigured };
