const express = require("express");
const {
  createJob,
  updateJobStatus,
  getAllJobs,
  getJobByJobNo,
  searchJob,
  updateJobById,
  deleteJobById,
  deleteJob,
} = require("../Controllers/job.controller");

const router = express.Router();
const jobController = require("../Controllers/job.controller");

router.put("/:jobNo/status", updateJobStatus);
router.post("/", createJob);
router.get("/", getAllJobs);
router.get("/status", searchJob);
router.put("/:id", updateJobById);
router.delete("/:id", deleteJobById);
router.get("/:jobNo", getJobByJobNo);
router.delete("/:jobNo", deleteJob);
router.get("/:jobNo/pdf", jobController.generateJobPDF);


module.exports = router;
