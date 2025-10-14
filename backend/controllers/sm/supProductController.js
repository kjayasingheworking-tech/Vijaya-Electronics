const SupProduct = require('../../models/sm/SupProduct');
const SupProductHistory = require('../../models/sm/SupProductHistory');
const { PurchaseOrder } = require("../../models/sm/PurchaseOrder");

function diffFields(oldDoc, newDoc) {
  const fields = ['name','description','specifications','unitPrice','isAvailable','categories','sku','isActive','images'];

  const changed = [];
  for (const f of fields) {
    const a = JSON.stringify(oldDoc[f] ?? null);
    const b = JSON.stringify(newDoc[f] ?? null);
    if (a !== b) changed.push(f);
  }
  return changed;
}


// Create single product
// Create single product
exports.createSupProduct = async (req, res, next) => {
  try {
    const body = req.body || {};
    const fileUrls = (req.files || []).map(
      f => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`
    );

    // normalize images from body (can be single string or array)
    const bodyImages = Array.isArray(body.images)
      ? body.images
      : body.images ? [body.images] : [];

    // ---- Normalize specifications ----
    let specifications = body.specifications;
    if (typeof specifications === "string") {
      try {
        specifications = JSON.parse(specifications);
      } catch {
        specifications = [];
      }
    }
    if (!Array.isArray(specifications)) specifications = [];

    // ---- Normalize categories ----
    let categories = body.categories;
    if (typeof categories === "string") {
      // allow comma-separated
      categories = categories.split(",").map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(categories)) {
      categories = categories ? [categories] : [];
    }

    // ---- Normalize isAvailable & unitPrice ----
    const isAvailable =
      body.isAvailable === true || String(body.isAvailable) === "true";
    const unitPrice = Number(body.unitPrice || 0);

    const payload = {
      ...body,
      supplier: req.user._id,
      images: [...bodyImages, ...fileUrls],
      specifications,
      categories,
      isAvailable,
      unitPrice,
    };

    const product = await SupProduct.create(payload);

    await SupProductHistory.create({
      product: product._id,
      version: product.version,
      changedBy: req.user._id,
      snapshot: product.toObject(),
      changedFields: ["_init"],
    });

    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
};

// Bulk create
exports.bulkCreateSupProducts = async (req, res, next) => {
  try {
    const docs = req.body.map(p => ({ ...p, supplier: req.user._id, images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : [])}));
    const created = await SupProduct.insertMany(docs);

    await SupProductHistory.insertMany(
      created.map(p => ({
        product: p._id,
        version: p.version,
        changedBy: req.user._id,
        snapshot: p.toObject(),
        changedFields: ['_init']
      }))
    );

    res.status(201).json({ count: created.length, products: created });
  } catch (e) { next(e); }
};

// List
exports.listSupProducts = async (req, res, next) => {
  try {
    const filter = { supplier: req.user._id };
    const products = await SupProduct.find(filter).sort('-updatedAt').lean();
    res.json(products);
  } catch (e) { next(e); }
};


// Update product
exports.updateSupProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    let { specifications, categories, unitPrice, isAvailable } = req.body || {};

    // --- normalize like createSupProduct ---
    if (typeof specifications === "string") {
      try { specifications = JSON.parse(specifications); } catch { specifications = []; }
    }
    if (!Array.isArray(specifications)) specifications = [];

    if (typeof categories === "string") {
      categories = categories.split(",").map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(categories)) {
      categories = categories ? [categories] : [];
    }

    isAvailable = (isAvailable === true || String(isAvailable) === "true");
    unitPrice   = Number(unitPrice || 0);

    const before = await SupProduct.findById(id).lean();
    if (!before) return res.status(404).json({ message: "Product not found" });

    // apply update
    const doc = await SupProduct.findByIdAndUpdate(
      id,
      { ...req.body, specifications, categories, isAvailable, unitPrice },
      { new: true, runValidators: true }
    );

    // bump version
    doc.version = (before.version || 1) + 1;
    await doc.save();

    // find changed fields
    const watch = ["name","description","unitPrice","isAvailable","sku","categories","specifications","images"];
    const changedFields = watch.filter(
      k => JSON.stringify(before[k]) !== JSON.stringify(doc.toObject()[k])
    );

    await SupProductHistory.create({
      product: doc._id,
      version: doc.version,
      changedBy: req.user._id,
      snapshot: doc.toObject(),
      changedFields: changedFields.length ? changedFields : ["_update"]
    });

    res.json(doc);
  } catch (e) { next(e); }
};


// History
exports.getSupProductHistory = async (req, res, next) => {
  try {
    const history = await SupProductHistory.find({ product: req.params.id }).sort('-createdAt').lean();
    res.json(history);
  } catch (e) { next(e); }
};


// ADMIN: list products (all or by supplier)
exports.adminListSupProducts = async (req, res, next) => {
  try {
    const { supplier } = req.query; // optional
    const filter = supplier ? { supplier } : {};
    const products = await SupProduct.find(filter)
      .populate("supplier", "name email role") // optional
      .sort("-updatedAt")
      .lean();
    res.json(products);
  } catch (e) { next(e); }
};

// Upload images for a product
exports.uploadSupProductImages = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;

    const p = await SupProduct.findById(productId);
    if (!p) return res.status(404).json({ message: "Product not found" });
    if (String(p.supplier) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // No files?
    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Build absolute URLs for uploaded files
    const uploadedUrls = req.files.map(
      f => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`
    );

    // Optional: prevent duplicates if user re-uploads the same file names/URLs
    const current = new Set((p.images || []).map(String));
    const uniqueToAdd = uploadedUrls.filter(u => !current.has(String(u)));

    if (uniqueToAdd.length === 0) {
      return res.status(200).json({ added: [], product: p });
    }

    // Persist
    p.images = [...(p.images || []), ...uniqueToAdd];
    p.version = (p.version || 1) + 1;                 // bump version safely
    await p.save();

    // History entry
    await SupProductHistory.create({
      product: p._id,
      version: p.version,
      changedBy: userId,
      snapshot: p.toObject(),                         // snapshot after change
      changedFields: ["images"]
    });

    // 200 OK (not 201; we updated an existing resource)
    res.status(200).json({ added: uniqueToAdd, product: p });
  } catch (e) {
    next(e);
  }
};



// Delete
exports.deleteSupProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check product exists and belongs to current supplier
    const product = await SupProduct.findOne({ _id: id, supplier: userId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check whether product is used in any Purchase Order
    const usedInPO = await PurchaseOrder.exists({ "items.product": id });
    if (usedInPO) {
      return res.status(400).json({
        message: `Product "${product.name}" cannot be deleted because it is used in one or more purchase orders.`,
      });
    }

    // Safe to delete
    await SupProduct.deleteOne({ _id: id });
    res.json({ message: `Product "${product.name}" deleted successfully.` });
  } catch (e) {
    next(e);
  }
};