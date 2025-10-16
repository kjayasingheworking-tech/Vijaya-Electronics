const Technician = require("../Model/technician.model");
const TechModel = require("../Model/TechModel");

//Create new technician
exports.createTechnician = async (req, res) => {
  try {
    const tech = await Technician.create(req.body);
    res.status(201).json(tech);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Get available technicians (<5 active jobs)
exports.getAvailableTechnicians = async (req, res) => {
  try {
    const activeStatuses = ["Pending", "In Progress"];

    const counts = await TechModel.aggregate([
      { $match: { status: { $in: activeStatuses } } },
      { $group: { _id: "$technicianId", activeCount: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.activeCount]));

    const technicians = await Technician.find({ isActive: true }).lean();

    const available = technicians.filter((t) => {
      const activeJobs = countMap.get(String(t._id)) || 0;
      const maxJobs = t.maxJobs ?? 5;
      return activeJobs < maxJobs;
    });

    res.json(available);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get all technicians (for admin use)
exports.getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find();
    if (!technicians.length)
      return res.status(404).json({ message: "No technicians found" });

    res.status(200).json(technicians); 
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


//Update technician
exports.updateTechnician = async (req, res) => {
  try {
    const updated = await Technician.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Technician not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Delete technician
exports.deleteTechnician = async (req, res) => {
  try {
    const deleted = await Technician.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Technician not found" });
    res.json({ message: "Technician deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





