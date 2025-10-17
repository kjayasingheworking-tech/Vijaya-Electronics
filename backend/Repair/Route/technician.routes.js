const express = require("express");
const {
  createTechnician,
  getAvailableTechnicians,
  getAllTechnicians,
  updateTechnician,
  deleteTechnician,
} = require("../Controllers/technician.controller");

const router = express.Router();

router.post("/", createTechnician);
router.get("/", getAllTechnicians);
router.get("/available", getAvailableTechnicians);
router.put("/:id", updateTechnician);      
router.delete("/:id", deleteTechnician);  

module.exports = router;
