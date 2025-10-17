import React, { useState, useEffect } from "react";

function AddTechnician() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    specialization: "",
  });
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // 👈 store technician being edited
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    mobile: "",
    specialization: "",
    isActive: true,
  });

  // Input handler
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Add Technician
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    try {
      const res = await fetch("http://localhost:5000/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();

      if (res.ok) {
        setSuccess("✅ Technician added successfully!");
        setFormData({ name: "", email: "", mobile: "", specialization: "" });
        fetchTechnicians();
      } else {
        setError(result.message || "Failed to add technician");
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ Error connecting to server");
    }
  };

  // Fetch technicians
  const fetchTechnicians = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/technicians");
      const data = await res.json();

      if (Array.isArray(data)) {
        setTechnicians(data);
      } else if (Array.isArray(data.technicians)) {
        setTechnicians(data.technicians);
      } else {
        setTechnicians([]);
        setError("No technicians found");
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ Unable to fetch technicians");
    } finally {
      setLoading(false);
    }
  };

  // Delete technician
  const deleteTechnician = async (id) => {
    if (!window.confirm("🗑️ Are you sure you want to delete this technician?"))
      return;
    try {
      const res = await fetch(`http://localhost:5000/technicians/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess("🗑️ Technician deleted successfully!");
        fetchTechnicians();
      } else setError("Failed to delete technician");
    } catch (err) {
      console.error(err);
      setError("Error deleting technician");
    }
  };

  // Edit modal open
  const handleEdit = (tech) => {
    setEditData({
      name: tech.name,
      email: tech.email || "",
      mobile: tech.mobile,
      specialization: tech.specialization || "",
      isActive: tech.isActive,
    });
    setEditing(tech._id);
  };

  // Edit modal save
  const saveEdit = async () => {
    try {
      const res = await fetch(`http://localhost:5000/technicians/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("✅ Technician updated successfully!");
        setEditing(null);
        fetchTechnicians();
      } else {
        setError(data.message || "Failed to update technician");
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ Error updating technician");
    }
  };

  // Fetch when table shown
  useEffect(() => {
    if (showTable) fetchTechnicians();
  }, [showTable]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center py-10 font-sans">
      {/* Add Technician Form */}
      <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-md border border-gray-200 mb-10">
        <h2 className="text-2xl font-bold text-[#0057B8] mb-6 text-center">
          ➕ Add New Technician
        </h2>

        {success && <p className="text-green-600 text-center mb-4">{success}</p>}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Technician Name"
            className="border p-3 rounded-lg focus:ring-2 focus:ring-[#0057B8]"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="border p-3 rounded-lg focus:ring-2 focus:ring-[#0057B8]"
          />
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Mobile Number (07XXXXXXXX)"
            className="border p-3 rounded-lg focus:ring-2 focus:ring-[#0057B8]"
            required
          />
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            placeholder="Specialization (e.g. Laptop Repairs)"
            className="border p-3 rounded-lg focus:ring-2 focus:ring-[#0057B8]"
          />

          <button
            type="submit"
            className="bg-[#FFA500] text-[#212529] font-semibold py-3 rounded-lg hover:bg-[#ffb733] transition"
          >
            Add Technician
          </button>
        </form>

        <button
          onClick={() => setShowTable(!showTable)}
          className="mt-6 w-full py-3 font-semibold rounded-lg border border-[#0057B8] text-[#0057B8] hover:bg-[#0057B8] hover:text-white transition"
        >
          {showTable ? "Hide Technicians" : "👀 View My Technicians"}
        </button>
      </div>

      {/* View Technicians Table */}
      {showTable && (
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[90%] max-w-5xl border border-gray-200">
          <h3 className="text-xl font-bold text-[#0057B8] mb-6 text-center">
            🧑‍🔧 All Technicians
          </h3>

          {loading ? (
            <p className="text-center text-gray-500">Loading technicians...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : technicians.length === 0 ? (
            <p className="text-center text-gray-500">No technicians found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead className="bg-[#0057B8] text-white">
                <tr>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Email</th>
                  <th className="p-3 border">Mobile</th>
                  <th className="p-3 border">Specialization</th>
                  <th className="p-3 border">Active Jobs</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((t) => (
                  <tr key={t._id} className="text-center hover:bg-gray-50">
                    <td className="p-3 border">{t.name}</td>
                    <td className="p-3 border">{t.email || "-"}</td>
                    <td className="p-3 border">{t.mobile}</td>
                    <td className="p-3 border">{t.specialization || "-"}</td>
                    <td className="p-3 border">{t.currentActiveJobs ?? 0}</td>
                    <td
                      className={`p-3 border font-semibold ${
                        t.isActive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="p-3 border space-x-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTechnician(t._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ✏️ Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-[90%] max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-[#0057B8] mb-4 text-center">
              ✏️ Edit Technician
            </h3>

            <div className="flex flex-col gap-3">
              {Object.keys(editData).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-semibold mb-1 capitalize">
                    {key}
                  </label>
                  {key === "isActive" ? (
                    <select
                      value={editData[key]}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          [key]: e.target.value === "true",
                        })
                      }
                      className="border p-2 rounded w-full"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editData[key]}
                      onChange={(e) =>
                        setEditData({ ...editData, [key]: e.target.value })
                      }
                      className="border p-2 rounded w-full"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-5 gap-3">
              <button
                onClick={() => setEditing(null)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="bg-[#FFA500] px-4 py-2 rounded text-[#212529] font-semibold hover:bg-[#ffb733]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddTechnician;
