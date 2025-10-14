// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId; // <— accept common keys

    const user = await User.findById(userId).select("-password");
    if (!user || !user.isActive) return res.status(401).json({ message: "User not found/inactive" });

    req.user = user;
    return next();
  } catch (e) {
    console.error("protect error:", e);
    return res.status(401).json({ message: "Invalid/Expired token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { protect, authorize };
