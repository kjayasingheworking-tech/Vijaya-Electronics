import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

function CheckStatus() {
  const [formData, setFormData] = useState({ jobNo: "", nic: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    Name: "",
    Email: "",
    NIC: "",
    Technician: "",
    Mobile: "",
    Repair_Description: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    try {
      const query = formData.jobNo
        ? `jobNo=${formData.jobNo}`
        : `nic=${formData.nic}`;
      const res = await fetch(`http://localhost:5000/techs/status?${query}`);
      const data = await res.json();
      if (!res.ok) setError(data.message || "No job found");
      else setResult(data);
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    }
  };

  const handleEdit = () => {
    if (!result) return;
    setEditData({
      Name: result.Name || "",
      Email: result.Email || "",
      NIC: result.NIC || "",
      Technician: result.Technician || "",
      Mobile: result.Mobile || "",
      Repair_Description: result.Repair_Description || "",
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!result?._id) return alert("Job ID not found.");
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/techs/${result._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        setResult(updated.tech || updated);
        setShowEdit(false);
        setSuccess("Job updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else alert("Failed to update job");
    } catch (err) {
      console.error(err);
      alert("Error updating job");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!result?._id) return alert("Job ID not found.");
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      const res = await fetch(`http://localhost:5000/techs/${result._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Job deleted successfully!");
        setResult(null);
      } else alert("Failed to delete job.");
    } catch (error) {
      console.error(error);
      alert("Error deleting job.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E6ECFF] py-16 font-sans">
      <div className="max-w-lg mx-auto backdrop-blur-lg bg-white/60 shadow-2xl rounded-3xl p-10 border border-white/40 relative">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#0057B8]/20 via-transparent to-[#FFA500]/20 pointer-events-none"></div>

        <h2 className="text-center text-3xl font-bold text-[#0057B8] mb-8 drop-shadow-sm">
          🔍 Check Repair Status & Edit Details
        </h2>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in relative z-10">
          <div>
            <label className="block text-sm font-semibold mb-1">Job Number</label>
            <input
              type="text"
              name="jobNo"
              value={formData.jobNo}
              onChange={handleChange}
              placeholder="Enter your Job Number"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] bg-white/70 backdrop-blur-sm"
            />
          </div>

          <div className="text-center text-gray-400 font-medium">— OR —</div>

          <div>
            <label className="block text-sm font-semibold mb-1">NIC Number</label>
            <input
              type="text"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              placeholder="Enter your NIC Number"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] bg-white/70 backdrop-blur-sm"
            />
          </div>

          <div className="text-center pt-2">
            <button
              type="submit"
              className="bg-[#FFA500] text-[#212529] font-semibold px-8 py-2.5 rounded-full hover:bg-[#ffb733] shadow-lg hover:shadow-[#FFA500]/40 transition-transform hover:-translate-y-0.5"
            >
              Check Status
            </button>
          </div>
        </form>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mt-6 rounded animate-fade-in">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 mt-6 rounded animate-fade-in">
            ✅ {success}
          </div>
        )}

        {/* Job Details */}
        {result && (
          <div className="mt-8 bg-white/70 backdrop-blur-md border border-gray-200 p-6 rounded-2xl shadow-md animate-slide-up relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0057B8]/10 to-[#FFA500]/10 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-3 relative z-10">
              <h5 className="text-lg font-semibold text-[#0057B8]">Job Details</h5>
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="border border-[#0057B8] text-[#0057B8] p-2 rounded hover:bg-[#0057B8] hover:text-white transition"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={handleDelete}
                  className="border border-red-500 text-red-500 p-2 rounded hover:bg-red-500 hover:text-white transition"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-gray-700 relative z-10">
              <p><strong>Name:</strong> {result.Name}</p>
              <p><strong>Email:</strong> {result.Email}</p>
              <p><strong>NIC:</strong> {result.NIC}</p>
              <p><strong>Technician:</strong> {result.Technician}</p>
              <p><strong>Mobile:</strong> {result.Mobile}</p>
              <p><strong>Description:</strong> {result.Repair_Description}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="bg-[#FFA500] text-[#212529] px-3 py-1 rounded text-sm font-semibold">
                  {result?.status || "Pending"}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-lg relative border border-[#0057B8]/30">
              <h3 className="text-2xl font-bold text-[#0057B8] text-center mb-6">
                Edit Job Details
              </h3>

              {/* Editable Fields */}
              <div className="space-y-3">
                {["Name", "Email", "NIC", "Mobile", "Repair_Description", "Technician"].map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold mb-1">
                      {key}
                    </label>

                    {key === "Technician" ? (
                      <>
                        <input
                          type="text"
                          value={editData[key]}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          * Technician assignment cannot be changed.
                        </p>
                      </>
                    ) : (
                      <input
                        type="text"
                        value={editData[key]}
                        onChange={(e) =>
                          setEditData({ ...editData, [key]: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] bg-white/80"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-5 gap-3">
                <button
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={isSaving}
                  className="bg-[#FFA500] text-[#212529] font-semibold px-4 py-2 rounded hover:bg-[#ffb733] shadow-md transition"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckStatus;
