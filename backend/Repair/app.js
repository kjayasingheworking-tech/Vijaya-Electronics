const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const technicianRoutes = require("./Route/technician.routes");
const jobRoutes = require("./Route/job.routes");
const notificationRoutes = require("./Route/notification.routes");


const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Routes
app.use("/technicians", technicianRoutes);
app.use("/techs", jobRoutes);
app.use("/notifications", notificationRoutes);

//MongoDB connection
mongoose
  .connect(
    "mongodb+srv://palindapasindu_db_user:pali921@cluster0.40qldfr.mongodb.net/electric_smart_db",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(5001, () => {
      console.log("🚀 Server running on http://localhost:5001");
    });
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
