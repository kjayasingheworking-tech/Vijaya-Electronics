const mongoose = require("mongoose");
const TechModel = require("../Model/TechModel");
const Technician = require("../Model/technician.model");
const Notification = require("../Model/notification.model"); 
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");



//Create a new job
exports.createJob = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { Name, Email, NIC, Mobile, Repair_Description, technicianId } = req.body;

    const tech = await Technician.findById(technicianId).session(session);
    if (!tech || !tech.isActive) {
      throw new Error("Technician not found or inactive");
    }

    //Check technician’s active job count
    const activeStatuses = ["Pending", "In Progress"];
    const activeCount = await TechModel.countDocuments({
      technicianId,
      status: { $in: activeStatuses },
    }).session(session);

    if (activeCount >= (tech.maxJobs ?? 5)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Technician already has maximum active jobs",
      });
    }

    //Auto-increment Job_No
    const lastJob = await TechModel.findOne().sort({ Job_No: -1 }).session(session);
    const nextJobNo = lastJob ? lastJob.Job_No + 1 : 1001;

    //Create new job
    const [newJob] = await TechModel.create(
      [
        {
          Job_No: nextJobNo,
          Name,
          Email,
          NIC,
          Mobile,
          Repair_Description,
          technicianId,
          Technician: tech.name,
        },
      ],
      { session }
    );

    //Increment technician’s job count
    await Technician.updateOne(
      { _id: technicianId },
      { $inc: { currentActiveJobs: 1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "✅ Job card created successfully",
      Job_No: newJob.Job_No,
      job: newJob,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating job:", error);
    res.status(400).json({ message: error.message });
  }
};

//Update job status (handles decrement on Cancelled / Completed)
exports.updateJobStatus = async (req, res) => {
  const { jobNo } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["Pending", "In Progress", "Completed", "Cancelled"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const job = await TechModel.findOne({ Job_No: jobNo }).session(session);
    if (!job) throw new Error("Job not found");

    const prevStatus = job.status;
    job.status = status;
    await job.save({ session });

    const wasActive = ["Pending", "In Progress"].includes(prevStatus);
    const nowInactive = ["Completed", "Cancelled"].includes(status);

    //If moving from active → inactive, decrement technician count
    if (wasActive && nowInactive && job.technicianId) {
      await Technician.updateOne(
        { _id: job.technicianId },
        { $inc: { currentActiveJobs: -1 } },
        { session }
      );
      console.log(`🔻 Technician ${job.technicianId} active job count decremented`);
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "✅ Status updated successfully", job });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating job status:", error);
    res.status(400).json({ message: error.message });
  }
};

//Get all jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await TechModel.find()
      .populate("technicianId", "name email specialization currentActiveJobs")
      .sort({ Job_No: 1 });

    if (!jobs.length)
      return res.status(404).json({ message: "No jobs found" });

    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res
      .status(500)
      .json({ message: "❌ Server error while fetching jobs", error });
  }
};

//Get job by Job_No (used in CheckStatus)
exports.getJobByJobNo = async (req, res) => {
  try {
    const job = await TechModel.findOne({ Job_No: req.params.jobNo })
      .populate("technicianId", "name email specialization currentActiveJobs");

    if (!job) return res.status(404).json({ message: "Job not found" });

    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res
      .status(500)
      .json({ message: "❌ Server error while fetching job", error });
  }
};

//Search by Job_No or NIC
exports.searchJob = async (req, res) => {
  try {
    const { jobNo, nic } = req.query;
    if (!jobNo && !nic)
      return res
        .status(400)
        .json({ message: "Please provide Job Number or NIC." });

    const job = jobNo
      ? await TechModel.findOne({ Job_No: jobNo })
      : await TechModel.findOne({ NIC: nic });

    if (!job) return res.status(404).json({ message: "No job found." });
    res.status(200).json(job);
  } catch (error) {
    console.error("Error searching job:", error);
    res
      .status(500)
      .json({ message: "❌ Server error while searching job", error });
  }
};

//Update job by ID (used in CheckStatus.js)
exports.updateJobById = async (req, res) => {
  try {
    const job = await TechModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!job) return res.status(404).json({ message: "Job not found" });

    //Create a notification for admin
    await Notification.create({
      type: "Update",
      message: `Customer ${job.Name} updated their job details.`,
      customerName: job.Name,
      jobNo: job.Job_No,
    });

    res.status(200).json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "❌ Error updating job" });
  }
};


//Delete job by ID (used in CheckStatus.js frontend)
exports.deleteJobById = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const job = await TechModel.findById(req.params.id).session(session);
    if (!job) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Job not found" });
    }

    const activeStatuses = ["Pending", "In Progress"];
    if (job.technicianId && activeStatuses.includes(job.status)) {
      await Technician.updateOne(
        { _id: job.technicianId },
        { $inc: { currentActiveJobs: -1 } },
        { session }
      );
    }

    //Create notification for admin
    await Notification.create({
      type: "Delete",
      message: `Customer ${job.Name} deleted their repair job.`,
      customerName: job.Name,
      jobNo: job.Job_No,
    });

    await TechModel.deleteOne({ _id: job._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "🗑️ Job deleted and admin notified" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "❌ Error deleting job" });
  }
};


//Delete job by Job_No (for admin routes)
exports.deleteJob = async (req, res) => {
  const { jobNo } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const job = await TechModel.findOne({ Job_No: jobNo }).session(session);
    if (!job) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Job not found" });
    }

    const activeStatuses = ["Pending", "In Progress"];

    if (job.technicianId && activeStatuses.includes(job.status)) {
      await Technician.updateOne(
        { _id: job.technicianId },
        { $inc: { currentActiveJobs: -1 } },
        { session }
      );
    }

    await TechModel.deleteOne({ _id: job._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "🗑️ Job deleted successfully and technician job count updated.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting job:", error);
    res.status(500).json({
      message: "❌ Server error while deleting job",
      error,
    });
  }
};

//Generate and download JobCard PDF
exports.generateJobPDF = async (req, res) => {
  try {
    const { jobNo } = req.params;
    const job = await TechModel.findOne({ Job_No: jobNo });

    if (!job)
      return res.status(404).json({ message: "Job not found for this number" });

    // ✅ Make sure uploads directory exists
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const pdfPath = path.join(uploadDir, `JobCard_${jobNo}.pdf`);
    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF to file
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // 🔹 Company Branding Header
    doc
      .fontSize(26)
      .fillColor("#0057B8")
      .font("Helvetica-Bold")
      .text("Vijaya Electrics", { align: "center" });

    doc
      .moveDown(0.3)
      .fontSize(12)
      .fillColor("#333")
      .font("Helvetica")
      .text("Reliable Electrical & Electronic Repair Services", {
        align: "center",
      });

    doc
      .moveDown(0.2)
      .fontSize(10)
      .fillColor("#FFA500")
      .text("📞 Hotline: +94 77 123 4567 | ✉️ support@vijayaelectrics.lk", {
        align: "center",
      });

    doc.moveDown(1);
    doc
      .strokeColor("#FFA500")
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown(1.5);

    // 🔹 Title
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#0057B8")
      .text("Customer Job Card", { align: "center" });

    doc.moveDown(1);

    const leftX = 70;
    const rightX = 320;
    const startY = doc.y;

    // Left column: Customer details
    doc
      .fontSize(12)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text("Customer Details", leftX, startY);

    doc
      .moveDown(0.5)
      .font("Helvetica")
      .text(`Name: ${job.Name}`, leftX)
      .text(`Email: ${job.Email}`, leftX)
      .text(`NIC: ${job.NIC}`, leftX)
      .text(`Mobile: ${job.Mobile}`, leftX);

    // Right column: Technician details
    doc
      .font("Helvetica-Bold")
      .text("Technician Details", rightX, startY);

    doc
      .moveDown(0.5)
      .font("Helvetica")
      .text(`Technician: ${job.Technician}`, rightX)
      .text(`Description: ${job.Repair_Description}`, rightX, doc.y, {
        width: 220,
      });

    doc.moveDown(1.2);
    doc
      .strokeColor("#E0E0E0")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown(1.2);

    // Status section
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#0057B8")
      .text("Job Status:", 70)
      .fillColor("#FFA500")
      .text(` ${job.Status || "Pending"}`, 160, doc.y - 16);

    doc.moveDown(1.5);

    // Footer
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#333")
      .text(`Job Number: ${job.Job_No}`, 70)
      .text(`Created On: ${new Date().toLocaleString()}`, 70)
      .moveDown(2)
      .fillColor("#0057B8")
      .font("Helvetica-Oblique")
      .text(
        "Thank you for choosing Vijaya Electrics — we care about your trust and satisfaction.",
        { align: "center", width: 460 }
      );

    doc.moveDown(0.5);
    doc
      .fillColor("#999")
      .fontSize(9)
      .text("This is a system-generated document — no signature required.", {
        align: "center",
      });

    // ✅ Finish PDF
    doc.end();

    writeStream.on("finish", () => {
      res.download(pdfPath, `JobCard_${jobNo}.pdf`, (err) => {
        if (err) console.error("❌ Error sending PDF:", err);
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
