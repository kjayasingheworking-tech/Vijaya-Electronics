const { v4: uuidv4 } = require("uuid");
const Supplier = require("../../models/sm/Supplier");
const User = require("../../models/User");
const PurchaseOrder = require("../../models/sm/PurchaseOrder");

// ADMIN: create supplier user + profile
exports.adminCreateSupplier = async (req, res) => {
  try {
    const {
      userName, userEmail, tempPassword,
      companyName, address, branch,
      contactDetails, bankAccount, contactPerson
    } = req.body;

    const exists = await User.findOne({ email: userEmail });
    if (exists) return res.status(400).json({ message: "Login email already exists" });

    const supplierUser = await User.create({
      name: userName,
      email: userEmail,
      password: tempPassword || uuidv4().slice(0, 10),
      role: "supplier",
      isActive: true,
    });

    const supplierId = "SUP-" + uuidv4().slice(0, 8).toUpperCase();
    const supplier = await Supplier.create({
      user: supplierUser._id,
      supplierId,
      companyName,
      address,
      branch,
      contactDetails,
      bankAccount,
      contactPerson,
    });

    res.status(201).json({ message: "Supplier user & profile created", supplier });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ADMIN: delete supplier (with PO check)
exports.deleteSupplier = async (req, res) => {
  try {
    const sup = await Supplier.findById(req.params.id).populate("user");
    if (!sup) return res.status(404).json({ message: "Supplier not found." });

    // ✅ Load model correctly
    const { PurchaseOrder } = require("../../models/sm/PurchaseOrder");

    // ✅ Check using supplier.user (because PO.supplier refers to the User model)
    const linkedPO = await PurchaseOrder.findOne({ supplier: sup.user._id });
    if (linkedPO) {
      return res.status(400).json({
        message: "Cannot delete supplier — this supplier has existing purchase orders.",
      });
    }

    // ✅ Safe deletion
    await Supplier.findByIdAndDelete(sup._id);
    if (sup.user) await User.findByIdAndDelete(sup.user._id);

    res.json({ message: "Supplier deleted successfully." });
  } catch (e) {
    console.error("Delete Supplier Error:", e);
    res.status(500).json({ message: "Server error while deleting supplier." });
  }
};



// ADMIN: list suppliers
exports.listSuppliers = async (_req, res) => {
  try {
    const data = await Supplier.find({ archived: false })
      .populate("user", "name email role isActive");
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ADMIN: get supplier by id
exports.getSupplierById = async (req, res) => {
  try {
    const sup = await Supplier.findById(req.params.id)
      .populate("user", "name email role isActive");
    if (!sup) return res.status(404).json({ message: "Not found" });
    res.json(sup);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ADMIN: archive supplier (soft delete)
exports.archiveSupplier = async (req, res) => {
  try {
    const sup = await Supplier.findById(req.params.id).populate("user");
    if (!sup) return res.status(404).json({ message: "Not found" });

    // TODO: block if active orders exist (hook your Orders check here)
    sup.archived = true;
    await sup.save();

    if (sup.user) {
      sup.user.isActive = false;
      await sup.user.save();
    }

    res.json({ message: "Supplier archived" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// SUPPLIER: get own profile
exports.getMySupplierProfile = async (req, res) => {
  try {
    const sup = await Supplier.findOne({ user: req.user._id, archived: false });
    if (!sup) return res.status(404).json({ message: "Profile not found" });
    
    console.log("=== GET PROFILE DEBUG ===");
    console.log("Raw supplier from DB:", JSON.stringify(sup, null, 2));
    console.log("Supplier branch:", sup.branch);
    console.log("Supplier bankAccount:", JSON.stringify(sup.bankAccount, null, 2));
    console.log("=== END GET DEBUG ===");
    
    res.json(sup);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// SUPPLIER: update own profile
exports.updateMySupplierProfile = async (req, res) => {
  try {
    console.log("=== UPDATE PROFILE RECEIVED ===");
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Full request body:", JSON.stringify(req.body, null, 2));
    
    const sup = await Supplier.findOne({ user: req.user._id, archived: false });
    if (!sup) return res.status(404).json({ message: "Profile not found" });

    console.log("Found supplier ID:", sup._id);
    console.log("Current branch before update:", sup.branch);
    console.log("Current bankAccount before update:", JSON.stringify(sup.bankAccount));

    // Direct assignment approach
    if (req.body.companyName) sup.companyName = req.body.companyName;
    if (req.body.address) sup.address = req.body.address;
    if (req.body.hasOwnProperty('branch')) {
      console.log("Setting branch to:", req.body.branch);
      sup.branch = req.body.branch;
    }
    if (req.body.contactDetails) sup.contactDetails = req.body.contactDetails;
    if (req.body.contactPerson) sup.contactPerson = req.body.contactPerson;
    if (req.body.bankAccount) {
      console.log("Setting bankAccount to:", JSON.stringify(req.body.bankAccount));
      sup.bankAccount = req.body.bankAccount;
      sup.markModified('bankAccount');
    }

    console.log("After assignment - branch:", sup.branch);
    console.log("After assignment - bankAccount:", JSON.stringify(sup.bankAccount));

    const saved = await sup.save();
    
    console.log("After save - branch:", saved.branch);
    console.log("After save - bankAccount:", JSON.stringify(saved.bankAccount));
    console.log("Full saved document:", JSON.stringify(saved.toObject()));
    console.log("=== END UPDATE ===");

    res.json({ message: "Profile updated", supplier: saved });
  } catch (e) {
    console.error("=== UPDATE ERROR ===");
    console.error("Error updating profile:", e);
    console.error("Error stack:", e.stack);
    res.status(500).json({ message: e.message });
  }
};

// ADMIN: activate supplier
exports.activateSupplier = async (req, res) => {
  try {
    const sup = await Supplier.findById(req.params.id).populate("user");
    if (!sup) return res.status(404).json({ message: "Not found" });

    sup.archived = false;
    await sup.save();

    if (sup.user) {
      sup.user.isActive = true;
      await sup.user.save();
    }

    res.json({ message: "Supplier activated" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ADMIN: list archived suppliers
exports.listArchivedSuppliers = async (_req, res) => {
  try {
    const data = await Supplier.find({ archived: true })
      .populate("user", "name email role isActive");
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};



