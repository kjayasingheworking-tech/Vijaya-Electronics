const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");  
const supplierRoutes = require("./routes/sm/supplierRoutes");
const supProductRoutes = require("./routes/sm/supProductRoutes");
const customerRoutes = require("./routes/cm/customerRoutes");
const feedbackRoutes = require("./routes/cm/feedbackRoutes");
const poRoutes = require("./routes/sm/poRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const invoiceRoutes = require("./routes/sm/invoiceRoutes");
const ticketRoutes = require("./routes/cm/ticketRoutes");


dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("Supplier Management API running"));

app.use("/api/auth", authRoutes);                
app.use("/api/suppliers", supplierRoutes);        
app.use("/api/supproducts", supProductRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/po", poRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/inv", invoiceRoutes);

app.use("/api/tickets", ticketRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
