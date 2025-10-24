import React, { useEffect, useState } from "react";
import { Edit2, Trash2, Save, X } from "lucide-react";
import { REPAIR_API } from "../../config/api";

const ModifyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editJob, setEditJob] = useState(null); // store job being edited
  const [updatedStatus, setUpdatedStatus] = useState("");

  // ✅ Fetch all jobs
  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(REPAIR_API.JOBS);
      const data = await res.json();
      
      // If response is not OK but message is "No jobs found", treat as empty array not error
      if (!res.ok) {
        if (data.message && data.message.toLowerCase().includes('no jobs')) {
          setJobs([]);
        } else {
          throw new Error(data.message || "Failed to fetch jobs");
        }
      } else {
        setJobs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ✅ Update job status
  const handleUpdate = async (jobNo) => {
  try {
    const res = await fetch(`${REPAIR_API.JOBS}/${jobNo}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: updatedStatus }),
    });

    if (!res.ok) throw new Error("Failed to update job status");

    setEditJob(null);
    fetchJobs(); // Refresh list
  } catch (err) {
    console.error("Update failed:", err);
    alert("Error updating job.");
  }
};


  // ✅ Delete a job
 const handleDelete = async (jobNo) => {
  if (!window.confirm("Are you sure you want to delete this job?")) return;
  try {
    const res = await fetch(`${REPAIR_API.JOBS}/${jobNo}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete job");
    alert("✅ Job deleted successfully!");
    fetchJobs(); // refresh
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Error deleting job.");
  }
};


  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-[#FFA500]/20 text-[#FFA500]";
      case "In Progress":
        return "bg-blue-100 text-blue-600";
      case "Completed":
        return "bg-green-100 text-green-600";
      case "Cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-[#0057B8] mb-6">🛠 Modify Jobs</h2>

      {loading && (
        <p className="text-gray-500 animate-pulse">Loading job data...</p>
      )}
      {error && (
        <div className="text-red-600 font-medium bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="font-semibold">⚠️ Error Loading Jobs</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={fetchJobs} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* No jobs found message */}
      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block p-6 bg-blue-50 rounded-full mb-4">
            <svg className="w-16 h-16 text-[#0057B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Available to Modify</h3>
          <p className="text-gray-500 mb-4">Create repair jobs first to see them here.</p>
          <button 
            onClick={() => window.location.href = '/repair/admin/create-job'} 
            className="px-6 py-2 bg-[#0057B8] text-white rounded-lg hover:bg-[#00489a] transition"
          >
            Create New Job
          </button>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0057B8] text-white text-left">
                <th className="p-3">Job No</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Technician</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-semibold text-gray-800">
                    #{job.Job_No}
                  </td>
                  <td className="p-3">{job.Name}</td>
                  <td className="p-3">{job.Technician}</td>

                  <td className="p-3">
                    {editJob === job._id ? (
                      <select
                        value={updatedStatus}
                        onChange={(e) => setUpdatedStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center flex justify-center gap-2">
                    {editJob === job._id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(job.Job_No)}
                          className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => setEditJob(null)}
                          className="bg-gray-400 text-white p-2 rounded hover:bg-gray-500 transition"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditJob(job._id);
                            setUpdatedStatus(job.status);
                          }}
                          className="bg-[#FFA500] text-[#212529] p-2 rounded hover:bg-[#ffb733] transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(job.Job_No)}
                          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {jobs.length === 0 && (
            <p className="text-gray-500 mt-4">No jobs available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ModifyJobs;
