const Notification = require("../models/Notification");
const { PurchaseOrder } = require("../models/sm/PurchaseOrder"); // ✅ add this

async function notify({ recipient, role, po, event, message, title, link }) {
  try {
    let poNumber = null;
    if (po) {
      const p = await PurchaseOrder.findById(po).select("poNumber").lean();
      poNumber = p?.poNumber || null;
    }

    await Notification.create({
      recipient,
      role,
      po,
      poNumber,  // ✅ store for frontend
      event,
      title: title || "Notification",
      message,
      link: link || null,
      read: false,
    });
  } catch (e) {
    console.error("Notify error:", e);
  }
}

module.exports = { notify };
