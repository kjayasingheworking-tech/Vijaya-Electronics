import React, { useEffect, useState } from "react";
import { REPAIR_API } from "../../config/api";

const AllJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch jobs from backend
  useEffect(() => {
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
        console.error("Error fetching jobs:", err);
        setError(err.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // ✅ Color-coded status badge
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
      <h2 className="text-2xl font-bold text-[#0057B8] mb-6">
        📋 All Repair Jobs
      </h2>

      {/* Loading or error messages */}
      {loading && (
        <p className="text-gray-500 animate-pulse">Loading job data...</p>
      )}
      {error && (
        <div className="text-red-600 font-medium bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="font-semibold">⚠️ Error Loading Jobs</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
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
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Repair Jobs Found</h3>
          <p className="text-gray-500 mb-4">There are currently no repair jobs in the system.</p>
          <button 
            onClick={() => window.location.href = '/repair/admin/create-job'} 
            className="px-6 py-2 bg-[#0057B8] text-white rounded-lg hover:bg-[#00489a] transition"
          >
            Create First Job
          </button>
        </div>
      )}

      {/* Jobs table */}
      {!loading && !error && jobs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0057B8] text-white text-left">
                <th className="p-3">Job No</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Technician</th>
                <th className="p-3">Email</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Status</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => (
                <tr
                  key={job._id || index}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-semibold text-gray-800">
                    #{job.Job_No || "N/A"}
                  </td>
                  <td className="p-3">{job.Name}</td>
                  <td className="p-3">{job.Technician}</td>
                  <td className="p-3">{job.Email}</td>
                  <td className="p-3">{job.Mobile}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.status || "Unknown"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 truncate max-w-[250px]">
                    {job.Repair_Description || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {jobs.length === 0 && (
            <p className="text-gray-500 mt-4">No repair jobs found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AllJobs;
