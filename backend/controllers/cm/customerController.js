const { v4: uuidv4 } = require("uuid");
const CustomerProfile = require("../../models/cm/CustomerProfile");
const User = require("../../models/User");

// GET /api/customers/me
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authorized" });

    let profile = await CustomerProfile.findOne({ user: userId })
      .populate("user", "name email role isActive createdAt");

    if (!profile) {
      // 🔧 ensure required customerId is set on first creation
      profile = await CustomerProfile.create({
        user: userId,
        customerId: `CUST-${uuidv4()}`
      });
      profile = await profile.populate("user", "name email role isActive createdAt");
    }

    return res.json({ profile });
  } catch (e) {
    console.error("getMyProfile error:", e);
    return res.status(500).json({ message: "Server error fetching profile" });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authorized" });

    const {
      name, phone, addressLine1, addressLine2, city, country, wholesalePreferred, loyaltyPoints,
    } = req.body;

    let profile = await CustomerProfile.findOne({ user: userId });
    if (!profile) {
      // 🔧 also guard here in case someone’s first touch is PUT
      profile = await CustomerProfile.create({
        user: userId,
        customerId: `CUST-${uuidv4()}`
      });
    }

    if (phone !== undefined) profile.phone = phone;
    if (addressLine1 !== undefined) profile.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) profile.addressLine2 = addressLine2;
    if (city !== undefined) profile.city = city;
    if (country !== undefined) profile.country = country;
    if (wholesalePreferred !== undefined) profile.wholesalePreferred = !!wholesalePreferred;
    if (loyaltyPoints !== undefined) profile.loyaltyPoints = Number(loyaltyPoints);

    await profile.save();

    if (name !== undefined && name !== req.user?.name) {
      await User.findByIdAndUpdate(userId, { name });
    }

    const populated = await CustomerProfile.findById(profile._id)
      .populate("user", "name email role isActive createdAt");
    return res.json({ profile: populated });
  } catch (e) {
    console.error("updateMyProfile error:", e);
    return res.status(500).json({ message: "Server error updating profile" });
  }
};

// In customerController.js
exports.createCustomer = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      addressLine1, 
      addressLine2, 
      city, 
      country, 
      wholesalePreferred 
    } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create User (role = customer)
    const user = await User.create({ name, email, password, role: "customer" });

    // Generate UUID-based customerId
    const customerId = `CUST-${uuidv4()}`; 
    // Example: CUST-550e8400-e29b-41d4-a716-446655440000

    // Create Profile with generated ID
    const profile = await CustomerProfile.create({
      user: user._id,
      customerId,
      phone,
      addressLine1,
      addressLine2,
      city,
      country,
      wholesalePreferred,
    });

    res.status(201).json({
      message: "Customer account created",
      user: { id: user._id, name: user.name, email: user.email },
      profile,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE /api/customers/me
exports.deleteMyCustomer = async (req, res) => {
  try {
    const profile = await CustomerProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Delete profile + user
    await CustomerProfile.deleteOne({ _id: profile._id });
    await User.deleteOne({ _id: req.user._id });

    res.json({ message: "Customer account deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/customers (Admin only)
exports.listAllCustomers = async (req, res) => {
  try {
    const customers = await CustomerProfile.find()
      .populate("user", "name email role isActive createdAt");

    res.json({ customers });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
