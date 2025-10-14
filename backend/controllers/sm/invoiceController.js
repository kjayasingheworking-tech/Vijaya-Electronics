const mongoose = require("mongoose");
const { PurchaseOrder } = require("../../models/sm/PurchaseOrder");
const { Invoice, INVOICE_STATUS, INVOICE_TYPE } = require("../../models/sm/Invoice");
const DamageInquiry = require("../../models/sm/DamageInquiry");
const Supplier = require("../../models/sm/Supplier");
const { notify } = require("../../utils/notifier");

// Resolve supplier USER id
async function getSupplierUserId(supplierId) {
  const s = await Supplier.findById(supplierId).select("user").lean();
  return s?.user || supplierId;
}

// ---------- Supplier: create ORIGINAL invoice for a PO ----------
exports.supplierCreateInvoice = async (req, res, next) => {
  try {
    const { purchaseOrder, additionalCharges = [], notes = "" } = req.body;

    const po = await PurchaseOrder.findOne({ _id: purchaseOrder, supplier: req.user._id }).lean();
    if (!po) return res.status(404).json({ message: "PO not found for this supplier" });

    const items = po.items.map((it) => ({
      product: it.product,
      name: it.name,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      lineTotal: it.unitPrice * it.quantity,
    }));

    // ✅ Check if supplier already issued one
    const existing = await Invoice.findOne({
      purchaseOrder,
      supplier: req.user._id,
      type: INVOICE_TYPE.ORIGINAL,
    });
    if (existing) {
      return res.status(400).json({ message: "Invoice already issued for this Purchase Order." });
    }


    const invoice = new Invoice({
      type: INVOICE_TYPE.ORIGINAL,
      status: INVOICE_STATUS.ISSUED,
      purchaseOrder: po._id,
      supplier: po.supplier,
      items,
      additionalCharges,
      deductions: [],
      totals: { subTotal: 0, chargesTotal: 0, deductionTotal: 0, grandTotal: 0 },
      history: [
        { actor: req.user._id, role: "supplier", from: null, to: INVOICE_STATUS.ISSUED, note: "Original invoice issued" },
      ],
      notes,
    });

    // Generate sequential invoiceNumber
  const lastInv = await Invoice.findOne().sort({ createdAt: -1 }).select("invoiceNumber").lean();
  let nextNum = 1;
  if (lastInv?.invoiceNumber) {
    const match = lastInv.invoiceNumber.match(/\d+$/);
    if (match) nextNum = parseInt(match[0]) + 1;
  }
  invoice.invoiceNumber = `INV-${String(nextNum).padStart(5, "0")}`;


    invoice.recalcTotals();
    await invoice.save();

    // Notify admin (company user who created the PO) with deep link to admin PO
    await notify({
      recipient: po.createdBy,
      role: "admin",
      po: po._id,
      event: "INVOICE_ISSUED",
      title: `New Invoice Issued`,
      message: `Supplier issued invoice ${invoice.invoiceNumber} for PO ${po.poNumber}.`, // ✅ friendlier
      link: `/admin/invoices/${invoice._id}`, 
    });

    res.status(201).json(invoice);
  } catch (e) {
    next(e);
  }
};

// ---------- Company/Admin: list & get invoices ----------
exports.adminListInvoices = async (req, res, next) => {
  try {
    const { supplier, po, status, type, invoiceNumber } = req.query;

    const filter = {};
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (type)    filter.type = type;

    // Search by invoice number (case-insensitive, partial)
    if (invoiceNumber) {
      filter.invoiceNumber = new RegExp(invoiceNumber, "i");
    }

    //Only apply PO filter if it’s a valid ObjectId (prevents 500s)
    if (po && mongoose.Types.ObjectId.isValid(po)) {
      filter.purchaseOrder = po;
    }

    const rows = await Invoice.find(filter).sort("-createdAt").lean();
    res.json(rows);
  } catch (e) {
    next(e);
  }
};


exports.adminGetInvoice = async (req, res, next) => {
  try {
    const row = await Invoice.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  } catch (e) {
    next(e);
  }
};

// ---------- Supplier: list my invoices ----------
// ---------- Supplier: list my invoices ----------
exports.supplierListInvoices = async (req, res, next) => {
  try {
    const { po, status, invoiceNumber } = req.query;
    const filter = { supplier: req.user._id };

    // ✅ Apply PO filter (important!)
    if (po && mongoose.Types.ObjectId.isValid(po)) {
      filter.purchaseOrder = po;
    }

    // Optional: filter by status
    if (status) filter.status = status;

    // Optional: search by invoice number (case-insensitive partial match)
    if (invoiceNumber) {
      filter.invoiceNumber = new RegExp(invoiceNumber, "i");
    }

    const rows = await Invoice.find(filter)
      .populate({ path: "purchaseOrder", select: "poNumber" })
      .sort("-createdAt")
      .lean();

    res.json(rows);
  } catch (e) {
    console.error("Error in supplierListInvoices:", e);
    next(e);
  }
};


// ---------- Admin: List original issued invoices for a specific PO ----------
exports.adminListOriginalIssuedInvoicesForPo = async (req, res, next) => {
  try {
    const { po } = req.query;

    if (!po) {
      return res.status(400).json({ message: "Purchase order ID is required" });
    }

    // fetch all invoices for this PO that are type ORIGINAL & ISSUED
    const invoices = await Invoice.find({
      purchaseOrder: po,
      type: INVOICE_TYPE.ORIGINAL,
      status: INVOICE_STATUS.ISSUED,
    })
      .select("_id invoiceNumber createdAt status type")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(invoices);
  } catch (err) {
    console.error("adminListOriginalIssuedInvoicesForPo error:", err);
    next(err);
  }
};


// ---------- Admin: Create Damage Inquiry & Recalculate ----------
exports.adminCreateDamageInquiryAndRecalculate = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { purchaseOrder, originalInvoice, items = [], note = "" } = req.body;

    if (!items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "At least one damaged item is required" });
    }

    // 1️ Load PO & Original invoice
    const po = await PurchaseOrder.findById(purchaseOrder).session(session);
    if (!po) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "PO not found" });
    }

    const inv = await Invoice.findById(originalInvoice).session(session);
    if (!inv) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Original invoice not found" });
    }

    if (String(inv.purchaseOrder) !== String(po._id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invoice does not belong to this PO" });
    }
    if (inv.type !== INVOICE_TYPE.ORIGINAL) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Only original invoices can be recalculated" });
    }
    if (inv.status !== INVOICE_STATUS.ISSUED) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Only 'issued' invoices can be recalculated" });
    }

    // 2️ Create Damage Inquiry (temporary — will link recalculated invoice later)
    const inquiry = await DamageInquiry.create(
      [
        {
          purchaseOrder: po._id,
          originalInvoice: inv._id,
          createdBy: req.user._id,
          items: items.map((i) => ({
            product: i.product,
            rejectedQty: i.rejectedQty,
            note: i.note || "",
          })),
          status: "open",
          note,
        },
      ],
      { session }
    );
    const inquiryDoc = inquiry[0];

    // 3️ Build deductions (use original unit prices)
    const unitByProduct = {};
    inv.items.forEach((it) => {
      unitByProduct[String(it.product)] = it.unitPrice;
    });

    const deductions = items.map((i) => {
      const unit = unitByProduct[String(i.product)];
      if (unit == null)
        throw new Error(`Product ${i.product} not present in original invoice`);
      return {
        product: i.product,
        reason: i.note || "damage/rejected",
        qty: i.rejectedQty,
        amount: unit * i.rejectedQty,
      };
    });

    // 4️ Create the RECALCULATED invoice
    const reInv = new Invoice({
      type: INVOICE_TYPE.RECALCULATED,
      status: INVOICE_STATUS.ISSUED,
      purchaseOrder: inv.purchaseOrder,
      supplier: inv.supplier,
      originalInvoice: inv._id,
      items: inv.items.map((it) => ({ ...(it.toObject?.() || it) })),
      additionalCharges: (inv.additionalCharges || []).map((c) => ({ ...c })),
      deductions,
      totals: { subTotal: 0, chargesTotal: 0, deductionTotal: 0, grandTotal: 0 },
      history: [
        {
          actor: req.user._id,
          role: "admin",
          from: null,
          to: INVOICE_STATUS.ISSUED,
          note: `Recalculated due to damage inquiry ${inquiryDoc._id}`,
        },
      ],
      notes: `Recalculated from invoice ${inv.invoiceNumber || inv._id}`,
    });

    // 4a️⃣ Generate sequential invoice number
    const last = await Invoice.findOne()
      .select("invoiceNumber")
      .sort({ createdAt: -1 })
      .lean()
      .session(session);

    let nextNum = 1;
    if (last?.invoiceNumber) {
      const m = last.invoiceNumber.match(/\d+$/);
      if (m) nextNum = parseInt(m[0], 10) + 1;
    }
    reInv.invoiceNumber = `INV-${String(nextNum).padStart(5, "0")}`;

    reInv.recalcTotals();
    await reInv.save({ session });

    // 5️ Update Damage Inquiry with recalculated invoice ID
    inquiryDoc.recalculatedInvoice = reInv._id;
    inquiryDoc.status = "applied";
    await inquiryDoc.save({ session });

    // 6️ Cancel the ORIGINAL invoice
    inv.history.push({
      actor: req.user._id,
      role: "admin",
      from: inv.status,
      to: INVOICE_STATUS.CANCELLED,
      note: `Cancelled due to damage inquiry ${inquiryDoc._id}`,
    });
    inv.status = INVOICE_STATUS.CANCELLED;
    await inv.save({ session });

    // 7️ Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 8️ Notify supplier (outside transaction)
    await notify({
      recipient: po.supplier,
      role: "supplier",
      po: po._id,
      invoice: reInv._id,
      event: "INVOICE_RECALCULATED",
      title: "Recalculated Invoice Issued",
      message: `Invoice ${inv.invoiceNumber || inv._id} was cancelled; recalculated invoice ${reInv.invoiceNumber} issued for PO ${po.poNumber}.`,
      link: `/supplier/invoices/${reInv._id}`,
    });

    return res.status(201).json({
      inquiry: inquiryDoc,
      recalculatedInvoice: reInv,
      cancelledInvoice: inv._id,
    });
  } catch (e) {
    try {
      await session.abortTransaction();
    } catch {}
    session.endSession();
    console.error(" Error in adminCreateDamageInquiryAndRecalculate:", e);
    next(e);
  }
};

// ---------- Admin: close an invoice ----------
exports.adminCloseInvoice = async (req, res, next) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "Not found" });
    if (inv.status === INVOICE_STATUS.CLOSED) return res.json(inv);

    const prev = inv.status;
    inv.status = INVOICE_STATUS.CLOSED;
    inv.history.push({ actor: req.user._id, role: "admin", from: prev, to: INVOICE_STATUS.CLOSED, note: "Invoice closed" });
    await inv.save();

    // Notify supplier USER with deep link to supplier order page
    const supplierUserId = await getSupplierUserId(inv.supplier);
    await notify({
      recipient: supplierUserId,
      role: "supplier",
      po: inv.purchaseOrder,
      event: "INVOICE_CLOSED",
      title: "Invoice Closed",
      message: `Invoice ${inv._id} closed by company.`,
      link: `/supplier/invoices/${inv._id}`,//  correct route
    });

    res.json(inv);
  } catch (e) {
    next(e);
  }
};


// ---------- Admin: list & get damage inquiries ----------
exports.adminListDamageInquiries = async (req, res, next) => {
  try {
    const inquiries = await DamageInquiry.find()
      .populate({ path: "purchaseOrder", select: "poNumber" })
      .populate({ path: "originalInvoice", select: "invoiceNumber" })
      .populate({ path: "recalculatedInvoice", select: "invoiceNumber" }) // ✅ this one adds recalculated invoice
      .sort({ createdAt: -1 })
      .lean();

    res.json(inquiries);
  } catch (e) {
    console.error("Error in adminListDamageInquiries:", e);
    next(e);
  }
};

exports.adminGetDamageInquiry = async (req, res, next) => {
  try {
    const inq = await DamageInquiry.findById(req.params.id)
      .populate({ path: "purchaseOrder", select: "poNumber" })
      .populate({ path: "originalInvoice", select: "invoiceNumber" })
      .populate({ path: "recalculatedInvoice", select: "invoiceNumber" });
    res.json(inq);
  } catch (e) {
    console.error("Error in adminGetDamageInquiry:", e);
    next(e);
  }
};

