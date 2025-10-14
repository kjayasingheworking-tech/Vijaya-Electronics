const { PurchaseOrder, PO_STATUS } = require("../../models/sm/PurchaseOrder");
const SupProduct = require("../../models/sm/SupProduct");
const Supplier = require("../../models/sm/Supplier");
const { notify } = require("../../utils/notifier");

// Resolve the supplier's USER id so /notifications/me (recipient = user._id) works
async function getSupplierUserId(supplierId) {
  const s = await Supplier.findById(supplierId).select("user").lean();
  return s?.user || supplierId; // fallback if your auth logs in with Supplier._id
}

// Allowed transitions by role
const FLOW = {
  supplier: {
    [PO_STATUS.NEW]: [PO_STATUS.ACCEPTED],
    [PO_STATUS.ACCEPTED]: [PO_STATUS.PACKING],
    [PO_STATUS.PACKING]: [PO_STATUS.SHIPPED],
  },
  admin: {
    [PO_STATUS.SHIPPED]: [PO_STATUS.DELIVERED],
    [PO_STATUS.DELIVERED]: [PO_STATUS.CHECKING],
    [PO_STATUS.CHECKING]: [PO_STATUS.INQUIRED, PO_STATUS.PENDING_PAYMENT],
    [PO_STATUS.INQUIRED]: [PO_STATUS.CHECKING, PO_STATUS.PENDING_PAYMENT],
    [PO_STATUS.PENDING_PAYMENT]: [PO_STATUS.PAYMENT_DONE],
    [PO_STATUS.PAYMENT_DONE]: [PO_STATUS.CLOSED],
  },
};

// ------- Create PO (admin) -------
exports.createPO = async (req, res, next) => {
  try {
    const { supplier, items = [], notes = "" } = req.body;
    if (!items.length) return res.status(400).json({ message: "At least one item is required" });

    // Validate items and denormalize from SupProduct
    const productIds = items.map((i) => i.product);
    const prods = await SupProduct.find({ _id: { $in: productIds } }).lean();
    const byId = Object.fromEntries(prods.map((p) => [String(p._id), p]));

    for (const it of items) {
      const p = byId[String(it.product)];
      if (!p) return res.status(400).json({ message: `Invalid product: ${it.product}` });
      if (String(p.supplier) !== String(supplier)) {
        return res.status(400).json({ message: "All products must belong to the specified supplier" });
      }
      if (p.isActive === false || p.isAvailable === false) {
        return res.status(400).json({ message: `Product ${p.name} is not available` });
      }
      it.name = p.name;
      it.unitPrice = p.unitPrice;
      if (typeof it.quantity !== "number" || it.quantity <= 0) {
        return res.status(400).json({ message: `Quantity required for product ${p.name}` });
      }
      it.lineTotal = p.unitPrice * it.quantity;
      Object.keys(it).forEach((k) => {
        if (!["product", "name", "unitPrice", "quantity", "lineTotal"].includes(k)) delete it[k];
      });
    }

    const po = new PurchaseOrder({
      supplier,
      createdBy: req.user._id,
      status: PO_STATUS.NEW,
      items,
      totals: { subTotal: 0, grandTotal: 0 },
      notes,
      history: [
        { actor: req.user._id, role: "admin", from: null, to: PO_STATUS.NEW, note: "PO created" },
      ],
    });

    // Generate next poNumber
      const lastPO = await PurchaseOrder.findOne().sort({ createdAt: -1 }).lean();
      let nextNum = 1;
      if (lastPO?.poNumber) {
        const match = lastPO.poNumber.match(/\d+$/);
        if (match) nextNum = parseInt(match[0]) + 1;
      }
      po.poNumber = `PO-${String(nextNum).padStart(5, "0")}`; // e.g. PO-00023


    po.recalcTotals();
    await po.save();

    // Notify supplier USER with deep link to supplier order page
    const supplierUserId = await getSupplierUserId(supplier);
    await notify({
      recipient: supplierUserId,
      role: "supplier",
      po: po._id,
      event: "PO_CREATED",
       title: "New Purchase Order Created",    
      message: `New purchase order (${po.poNumber}) created.`,
      link: `/supplier/orders/${po._id}`, // ✅ correct route
    });

    res.status(201).json(po);
  } catch (e) {
    next(e);
  }
};

// ------- List POs -------
exports.listCompanyPOs = async (req, res, next) => {
  try {
    const { status, supplier, poNumber } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;
    if (poNumber) filter.poNumber = new RegExp(poNumber, "i"); // case-insensitive search

    const pos = await PurchaseOrder.find(filter)
      .populate("supplier", "name email")
      .sort("-createdAt")
      .lean();
    res.json(pos);
  } catch (e) {
    next(e);
  }
};


exports.listSupplierPOs = async (req, res, next) => {
  try {
    const { status, poNumber } = req.query;
    const filter = { supplier: req.user._id };
    if (status) filter.status = status;
    if (poNumber) filter.poNumber = new RegExp(poNumber, "i");

    const pos = await PurchaseOrder.find(filter).sort("-createdAt").lean();
    res.json(pos);
  } catch (e) {
    next(e);
  }
};


// ------- Get single -------
exports.getCompanyPO = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate("supplier", "name email")
      .lean();
    if (!po) return res.status(404).json({ message: "Not found" });
    res.json(po);
  } catch (e) {
    next(e);
  }
};

exports.getSupplierPO = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      supplier: req.user._id,
    }).lean();
    if (!po) return res.status(404).json({ message: "Not found" });
    res.json(po);
  } catch (e) {
    next(e);
  }
};

// ------- Status transition (shared) -------
async function transition({ poId, actorId, role, to, note }) {
  const po = await PurchaseOrder.findById(poId);
  if (!po) return { error: { code: 404, message: "Not found" } };

  const allowed = FLOW[role][po.status] || [];
  if (!allowed.includes(to)) {
    return { error: { code: 400, message: `Invalid transition for ${role}: ${po.status} → ${to}` } };
  }

  const from = po.status;
  po.status = to;
  po.history.push({ actor: actorId, role, from, to, note: note || "" });
  await po.save();

  // Notify the other side with a deep link
  const recipientRole = role === "admin" ? "supplier" : "admin";
  let recipient;
  let link;
  if (role === "admin") {
    recipient = await getSupplierUserId(po.supplier);
    link = `/supplier/orders/${po._id}`;       // ✅ supplier route
  } else {
    recipient = po.createdBy;
    link = `/admin/purchase-orders/${po._id}`; // ✅ admin route
  }

  const EVENT = `PO_${to.toUpperCase()}`;
  const msgMap = {
    [PO_STATUS.ACCEPTED]: "Purchase order accepted by supplier.",
    [PO_STATUS.PACKING]: "Supplier started packing.",
    [PO_STATUS.SHIPPED]: "Order shipped by supplier.",
    [PO_STATUS.DELIVERED]: "Company marked as delivered.",
    [PO_STATUS.CHECKING]: "Company started checking.",
    [PO_STATUS.INQUIRED]: "Company inquired issues/damages.",
    [PO_STATUS.PENDING_PAYMENT]: "QA passed. Pending payment.",
    [PO_STATUS.PAYMENT_DONE]: "Payment completed.",
    [PO_STATUS.CLOSED]: "Order closed.",
  };

  await notify({
    recipient,
    role: recipientRole,
    po: po._id,
    event: EVENT,
    title: 'PO Status Updated',
    message: msgMap[to] || `PO status changed to ${to}.`,
    link,
  });

  return { po };
}

// Supplier transitions
exports.supplierChangeStatus = async (req, res, next) => {
  try {
    const { to, note } = req.body;
    const po = await PurchaseOrder.findOne({ _id: req.params.id, supplier: req.user._id });
    if (!po) return res.status(404).json({ message: "Not found" });

    const result = await transition({
      poId: po._id,
      actorId: req.user._id,
      role: "supplier",
      to,
      note,
    });
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result.po);
  } catch (e) {
    next(e);
  }
};

// Company transitions
exports.companyChangeStatus = async (req, res, next) => {
  try {
    const { to, note } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: "Not found" });

    const result = await transition({
      poId: po._id,
      actorId: req.user._id,
      role: "admin",
      to,
      note,
    });
    if (result.error) return res.status(result.error.code).json({ message: result.error.message });
    res.json(result.po);
  } catch (e) {
    next(e);
  }
};
