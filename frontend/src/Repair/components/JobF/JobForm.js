import React, { useState, useEffect } from "react";
import velogo from "../../Assets/velogo.jpg";

function JobForm() {
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    NIC: "",
    technicianId: "",
    Technician: "",
    Mobile: "",
    Repair_Description: "",
    Status: "Pending",
  });

  const [techOptions, setTechOptions] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [jobNo, setJobNo] = useState(null);

  //Fetch available technicians on load
  useEffect(() => {
    const loadTechs = async () => {
      try {
        const res = await fetch("http://localhost:5000/technicians/available");
        const data = await res.json();
        setTechOptions(data);
      } catch (err) {
        console.error("Failed to load technicians:", err);
      } finally {
        setLoadingTechs(false);
      }
    };
    loadTechs();
  }, []);

  //Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "technicianId") {
      const selected = techOptions.find((t) => t._id === value);
      setFormData({
        ...formData,
        technicianId: value,
        Technician: selected ? selected.name : "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  
  const validate = () => {
    const newErrors = {};
    if (!formData.Name.trim()) newErrors.Name = "Customer name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email))
      newErrors.Email = "Invalid email format";
    if (!/^[0-9]{9}[VvXx]|^[0-9]{12}$/.test(formData.NIC))
      newErrors.NIC = "NIC must be 10 digits + V/v/X/x or 12 digits";
    if (!formData.technicianId)
      newErrors.Technician = "Technician selection is required";
    if (!/^07\d{8}$/.test(formData.Mobile))
      newErrors.Mobile = "Mobile must start with 07 and contain 10 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await fetch("http://localhost:5000/techs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess("✅ Job card created successfully!");
        setJobNo(result.Job_No);

        // Refresh available technicians
        const updated = await fetch("http://localhost:5000/technicians/available");
        const newList = await updated.json();
        setTechOptions(newList);

        // Reset form
        setFormData({
          Name: "",
          Email: "",
          NIC: "",
          technicianId: "",
          Technician: "",
          Mobile: "",
          Repair_Description: "",
          Status: "Pending",
        });
        setErrors({});
        setTimeout(() => setSuccess(""), 4000);
      } else {
        alert(result.message || "Failed to create job card");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting form");
    }
  };

  //Download job card PDF
  const downloadPDF = async () => {
    if (!jobNo) return alert("No job created yet!");
    const response = await fetch(`http://localhost:5000/techs/${jobNo}/pdf`);
    if (!response.ok) return alert("Failed to download PDF");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JobCard_${jobNo}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-16 font-sans">
      <div className="max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-[#0057B8] via-[#E6ECFF] to-[#FFA500]/40">
        
        {/* Header */}
        <div className="text-center py-8">
          <img
            src={velogo}
            alt="Logo"
            className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-md mb-4"
          />
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">
            🧾 Customer Job Card
          </h2>
          <p className="text-blue-100 text-sm">
            Create and manage repair requests efficiently
          </p>
        </div>

        {/* Form Body */}
        <div className="bg-white/70 backdrop-blur-md p-10 rounded-t-3xl shadow-inner">
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            {/* Customer Name */}
            <div>
              <label className="font-semibold text-[#0057B8]">👤 Customer Name</label>
              <input
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                placeholder="Enter customer name"
                className={`w-full mt-1 border ${
                  errors.Name ? "border-red-500" : "border-gray-300"
                } rounded-lg p-2 focus:ring-2 focus:ring-[#0057B8] bg-white/80`}
              />
              {errors.Name && (
                <p className="text-red-500 text-sm">{errors.Name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="font-semibold text-[#0057B8]">✉️ Email</label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                placeholder="Enter email"
                className={`w-full mt-1 border ${
                  errors.Email ? "border-red-500" : "border-gray-300"
                } rounded-lg p-2 focus:ring-2 focus:ring-[#0057B8] bg-white/80`}
              />
              {errors.Email && (
                <p className="text-red-500 text-sm">{errors.Email}</p>
              )}
            </div>

            {/* NIC */}
            <div>
              <label className="font-semibold text-[#0057B8]">🆔 NIC</label>
              <input
                type="text"
                name="NIC"
                value={formData.NIC}
                onChange={handleChange}
                placeholder="Enter NIC number"
                className={`w-full mt-1 border ${
                  errors.NIC ? "border-red-500" : "border-gray-300"
                } rounded-lg p-2 focus:ring-2 focus:ring-[#0057B8] bg-white/80`}
              />
              {errors.NIC && (
                <p className="text-red-500 text-sm">{errors.NIC}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="font-semibold text-[#0057B8]">📱 Mobile</label>
              <div className="flex mt-1">
                <span className="bg-gray-200 border border-r-0 border-gray-300 px-3 py-2 rounded-l-lg text-gray-700">
                  +94
                </span>
                <input
                  type="text"
                  name="Mobile"
                  value={formData.Mobile}
                  onChange={handleChange}
                  placeholder="07XXXXXXXX"
                  className={`w-full border ${
                    errors.Mobile ? "border-red-500" : "border-gray-300"
                  } rounded-r-lg p-2 focus:ring-2 focus:ring-[#0057B8] bg-white/80`}
                />
              </div>
              {errors.Mobile && (
                <p className="text-red-500 text-sm">{errors.Mobile}</p>
              )}
            </div>

            {/* Technician Dropdown */}
            <div>
              <label className="font-semibold text-[#0057B8]">🔧 Technician</label>
              {loadingTechs ? (
                <p className="text-gray-500 mt-2">Loading technicians...</p>
              ) : (
                <select
                  name="technicianId"
                  value={formData.technicianId}
                  onChange={handleChange}
                  className={`w-full mt-1 border ${
                    errors.Technician ? "border-red-500" : "border-gray-300"
                  } rounded-lg p-2 focus:ring-2 focus:ring-[#0057B8] bg-white/80`}
                >
                  <option value="">-- Select available technician --</option>
                  {techOptions.length > 0 ? (
                    techOptions.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} {t.specialization ? `— ${t.specialization}` : ""}
                      </option>
                    ))
                  ) : (
                    <option value="">No available technicians</option>
                  )}
                </select>
              )}
              {errors.Technician && (
                <p className="text-red-500 text-sm">{errors.Technician}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="font-semibold text-[#0057B8]">🏷️ Status</label>
              <div className="mt-2">
                <span className="bg-[#FFA500] text-[#212529] px-3 py-1 rounded-md text-sm font-semibold shadow-sm">
                  {formData.Status}
                </span>
              </div>
            </div>

            {/* Repair Description */}
            <div className="md:col-span-2">
              <label className="font-semibold text-[#0057B8]">🛠️ Repair Description</label>
              <textarea
                name="Repair_Description"
                value={formData.Repair_Description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the repair work..."
                className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#0057B8] bg-white/80"
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex justify-center">
              <button
                type="submit"
                className="bg-[#FFA500] text-[#212529] font-bold px-8 py-3 rounded-full hover:bg-[#ffb733] hover:shadow-[#FFA500]/40 shadow-lg flex items-center gap-2 transition-transform hover:-translate-y-0.5"
              >
                <img src={velogo} alt="Logo" className="w-6 h-6" />
                Submit Job Card
              </button>
            </div>
          </form>

          {/* Download PDF Button */}
          {jobNo && (
            <div className="text-center mt-8">
              <button
                onClick={downloadPDF}
                className="bg-[#0057B8] text-white px-6 py-2 rounded-full hover:bg-[#00489a] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                📄 Download Job Card (PDF) — Job No {jobNo}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobForm;
