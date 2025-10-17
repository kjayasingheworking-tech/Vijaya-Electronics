import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Wrench, ClipboardList, UserPlus, Edit3, LogOut } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/");
  };

  const linkStyle =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all";

  return (
    <div className="bg-[#0057B8] text-white w-64 min-h-screen flex flex-col justify-between p-4">
      <div>
        <h2 className="text-xl font-bold mb-6 text-center text-[#FFA500]">
          ⚙️ Repair Manager
        </h2>

        <nav className="flex flex-col gap-3">
          <NavLink
            to="/admin/create-job"
            className={({ isActive }) =>
              `${linkStyle} ${
                isActive ? "bg-[#FFA500] text-[#212529]" : "hover:bg-[#00489a]"
              }`
            }
          >
            <Wrench size={18} /> Create Job
          </NavLink>

          <NavLink
            to="/admin/add-technician"
            className={({ isActive }) =>
              `${linkStyle} ${
                isActive ? "bg-[#FFA500] text-[#212529]" : "hover:bg-[#00489a]"
              }`
            }
          >
            <UserPlus size={18} /> Add Technician
          </NavLink>

          <NavLink
            to="/admin/all-jobs"
            className={({ isActive }) =>
              `${linkStyle} ${
                isActive ? "bg-[#FFA500] text-[#212529]" : "hover:bg-[#00489a]"
              }`
            }
          >
            <ClipboardList size={18} /> View All Jobs
          </NavLink>

          <NavLink
            to="/admin/modify-jobs"
            className={({ isActive }) =>
              `${linkStyle} ${
                isActive ? "bg-[#FFA500] text-[#212529]" : "hover:bg-[#00489a]"
              }`
            }
          >
            <Edit3 size={18} /> Modify Jobs
          </NavLink>

        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 bg-[#FFA500] text-[#212529] py-2 rounded-lg hover:bg-[#ffb733] font-semibold"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
};

export default Sidebar;
