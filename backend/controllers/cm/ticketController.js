const Ticket = require("../../models/cm/Ticket");
const TicketMessage = require("../../models/cm/TicketMessage");
const { notify } = require("../../utils/notifier");
const User = require("../../models/User");

// Helper to generate sequential ticket numbers
async function generateTicketNo() {
  const last = await Ticket.findOne().sort({ createdAt: -1 });
  const next = last ? parseInt(last.ticketNo.split("-")[1]) + 1 : 1001;
  return `TCK-${next}`;
}

// Ticket type required fields
const requiredFields = {
  "Product Inquiry": ["product_name", "model", "description"],
  "Product Complaint": [
    "product_name",
    "order_no",
    "purchase_date",
    "issue_description",
    "photos",
  ],
  "Delivery Delay": ["order_no", "delivery_date", "description"],
  "Product Usage Guidelines": ["product_model", "description"],
  "Service Request": [
    "product_name",
    "model",
    "warranty_status",
    "preferred_service_center",
    "description",
  ],
};

/* ----------------------------------------------------
   CREATE TICKET
---------------------------------------------------- */
exports.createTicket = async (req, res) => {
  try {
    const { name, contact_number, type } = req.body;
    let fields = {};

    if (req.body.fields) {
      try {
        fields =
          typeof req.body.fields === "string"
            ? JSON.parse(req.body.fields)
            : req.body.fields;
      } catch {
        return res.status(400).json({ message: "Invalid fields format" });
      }
    }

    // ✅ Add uploaded images
    if (req.files && req.files.length > 0) {
      const paths = req.files.map((f) => `/uploads/${f.filename}`);
      fields.photos = paths;
    }

    if (!name || !contact_number)
      return res
        .status(400)
        .json({ message: "Name and contact number are required" });

    if (!type)
      return res.status(400).json({ message: "Ticket type is required" });

    const missing = (requiredFields[type] || []).filter(
      (f) => !(fields && fields[f])
    );
    if (missing.length > 0)
      return res
        .status(400)
        .json({ message: `Missing required fields: ${missing.join(", ")}` });

    const ticketNo = await generateTicketNo();

    const ticket = await Ticket.create({
      ticketNo,
      customer: req.user._id,
      name,
      contact_number,
      type,
      fields,
    });

    // --- Notification with link ---
    const linkFor = (role, t) =>
      role === "admin"
        ? `/admin/tickets/${t._id}`
        : `/customer/tickets/${t._id}`;

    await notify({
      recipient: req.user._id,
      role: "customer",
      event: "ticket_created",
      title: "Ticket Raised",
      message: `Your ticket ${ticketNo} has been raised successfully.`,
      link: linkFor("customer", ticket),
    });

    // (Optional) also alert admins about new ticket
    const admin = await User.findOne({ role: "admin" }).lean();
    if (admin) {
      await notify({
        recipient: admin._id,
        role: "admin",
        event: "ticket_created",
        title: "New Ticket",
        message: `A new ticket ${ticketNo} has been created by ${name}.`,
        link: linkFor("admin", ticket),
      });
    }

    res.status(201).json(ticket);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ----------------------------------------------------
   LIST TICKETS
---------------------------------------------------- */
exports.listTickets = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { customer: req.user._id };
    const tickets = await Ticket.find(filter).sort("-createdAt").lean();
    res.json(tickets);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ----------------------------------------------------
   GET SINGLE TICKET
---------------------------------------------------- */
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("customer", "name email")
      .lean();
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ----------------------------------------------------
   ADD REPLY
---------------------------------------------------- */
exports.addReply = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.status === "CLOSED") {
      return res
        .status(400)
        .json({ message: "Ticket is closed; replies are not allowed." });
    }

    const senderType = req.user.role === "admin" ? "company" : "customer";

    const reply = await TicketMessage.create({
      ticket: ticket._id,
      senderType,
      message,
      attachments: req.body.attachments || [],
    });

    const linkFor = (role, t) =>
      role === "admin"
        ? `/admin/tickets/${t._id}`
        : `/customer/tickets/${t._id}`;

    if (senderType === "company") {
      ticket.status = "AWAITING CUSTOMER REPLY";
      await notify({
        recipient: ticket.customer,
        role: "customer",
        event: "company_reply",
        title: "Company Replied",
        message: `You’ve received a new reply on ticket ${ticket.ticketNo}.`,
        link: linkFor("customer", ticket),
      });
    } else {
      ticket.status = "UNDER REVIEW";
      const admin = await User.findOne({ role: "admin" }).lean();
      if (admin) {
        await notify({
          recipient: admin._id,
          role: "admin",
          event: "customer_reply",
          title: "Customer Replied",
          message: `Customer replied to ticket ${ticket.ticketNo}.`,
          link: linkFor("admin", ticket),
        });
      }
    }

    await ticket.save();
    res.status(201).json(reply);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ----------------------------------------------------
   UPDATE STATUS
---------------------------------------------------- */
exports.updateStatus = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = req.body.status;
    await ticket.save();

    const linkFor = (role, t) =>
      role === "admin"
        ? `/admin/tickets/${t._id}`
        : `/customer/tickets/${t._id}`;

    await notify({
      recipient: ticket.customer,
      role: "customer",
      event: "status_changed",
      title: "Ticket Status Updated",
      message: `Your ticket ${ticket.ticketNo} is now ${ticket.status}.`,
      link: linkFor("customer", ticket),
    });

    res.json(ticket);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ----------------------------------------------------
   FETCH MESSAGES
---------------------------------------------------- */
exports.getMessages = async (req, res) => {
  try {
    const messages = await TicketMessage.find({ ticket: req.params.id })
      .sort("createdAt")
      .lean();
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ----------------------------------------------------
   DELETE CLOSED TICKET (Admin Only)
---------------------------------------------------- */
exports.deleteTicket = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can delete tickets" });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.status !== "CLOSED")
      return res
        .status(400)
        .json({ message: "Only CLOSED tickets can be deleted" });

    await TicketMessage.deleteMany({ ticket: ticket._id });
    await ticket.deleteOne();

    res.json({ message: `Ticket ${ticket.ticketNo} deleted successfully` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
