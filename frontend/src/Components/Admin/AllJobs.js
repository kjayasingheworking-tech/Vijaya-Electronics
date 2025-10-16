import React, { useEffect, useState } from "react";

const AllJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:5000/techs");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch jobs");
        }

        setJobs(data);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("⚠️ Failed to load jobs. Please try again later.");
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
        <p className="text-red-600 font-medium bg-red-50 border-l-4 border-red-500 p-3 rounded">
          {error}
        </p>
      )}

      {/* Jobs table */}
      {!loading && !error && (
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
