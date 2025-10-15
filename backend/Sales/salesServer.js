const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productRoutes.js");
const productImageRoutes = require("./routes/productImageRoutes.js");
const customerRoutes = require("./routes/customerRoutes.js");
const cartRoutes = require("./routes/cartRoutes.js");
const checkoutRoutes = require("./routes/checkoutRoutes.js");
const paymentRoutes = require("./routes/paymentRoutes.js");
const invoiceRoutes = require("./routes/invoiceRoutes.js");
const discountRoutes = require("./routes/discountRoutes.js");
const paymentHistoryRoutes = require("./routes/paymentHistoryRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js");
const reportsRoutes = require("./routes/reportsRoutes.js");
const { errorHandler } = require("./middleware/errorHandler.js");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// customer routes
app.use("/products", productRoutes);
app.use("/product-images", productImageRoutes);
app.use("/cart", cartRoutes);
app.use("/checkout", checkoutRoutes);

//sales manager routes
app.use("/invoices", invoiceRoutes);
app.use("/discounts", discountRoutes);
app.use("/payment-history", paymentHistoryRoutes);
app.use("/customers", customerRoutes);
app.use("/payments", paymentRoutes);

//customer and sales manager notification routes
app.use("/notifications", notificationRoutes);

//reports routes
app.use("/reports", reportsRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;