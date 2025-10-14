const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, role = "customer" } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const user = await User.create({ name, email, password, role });
    const token = generateToken({ id: user._id, role: user.role });

    // OPTIONAL cookie (if you ever want httpOnly cookies instead of localStorage)
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   sameSite: "lax",
    //   secure: process.env.NODE_ENV === "production",
    //   maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    // });

    res.status(201).json({ user: { ...user.toObject(), password: undefined }, token });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🚫 Prevent inactive users from logging in
    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Your account is inactive. Please contact the administrator." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({ id: user._id, role: user.role });
    res.json({ user: { ...user.toObject(), password: undefined }, token });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ user: req.user });
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    // If you use httpOnly cookies, clear them here:
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    // If you also set a refresh token cookie, clear it as well:
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // For localStorage-based auth (your current setup), the client just deletes
    // its token; we return 200 to let the UI know logout succeeded.
    return res.status(200).json({ message: "Logged out" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};




// PUT /api/auth/me
// body: { name?, email?, currentPassword? }  // currentPassword optional but recommended for delete
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email } = req.body;
    let requireReLogin = false;

    // Update name
    if (name && name.trim() !== "") {
      user.name = name.trim();
    }

    // Update email: check uniqueness
    if (email && email.trim().toLowerCase() !== user.email) {
      const newEmail = email.trim().toLowerCase();
      const exists = await User.findOne({ email: newEmail });
      if (exists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = newEmail;
      requireReLogin = true; // force re-login when email changed
    }

    await user.save();

    // Return updated user (without password) and signal if re-login required
    const userSafe = { ...user.toObject(), password: undefined };
    res.json({ user: userSafe, requireReLogin });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE /api/auth/me
// body: { currentPassword }  // for security confirm current password (optional but recommended)
exports.deleteMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { currentPassword } = req.body || {};

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If password provided, verify before delete (safer)
    if (currentPassword) {
      const match = await user.matchPassword(currentPassword);
      if (!match) return res.status(401).json({ message: "Password incorrect" });
    }

    // Permanently delete user (if you prefer soft-delete, toggle isActive instead)
    await User.findByIdAndDelete(userId);

    // If you used cookies, clear them here (logout)
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    return res.json({ message: "Account deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
