const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});
const fileFilter = (req, file, cb) => {
  const ok = ["image/jpeg","image/png","image/webp"].includes(file.mimetype);
  cb(null, ok);
};
module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
