import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./Components/LandPage/Landing";
import CheckStatus from "./Components/Status/CheckStatus";
import JobF from "./Components/JobF/JobForm";
import AddTechnician from "./Components/AddTechnicians/AddTechnician";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import AllJobs from "./Components/Admin/AllJobs";
import ModifyJobs from "./Components/Admin/ModifyJobs";
import NotificationPanel from "./Components/Admin/NotificationPanel";
import RoleSwitcher from "./Components/utils/RoleSwitcher"; 

//Role protection wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const role = localStorage.getItem("role");

  if (!allowedRoles.includes(role)) {
    alert("Access denied. You must be an admin to view this page.");
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const role = localStorage.getItem("role");

  return (
    <div className="pt-[90px]">
      <RoleSwitcher />

      <Routes>
        <Route
          path="/"
          element={
            role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Landing />
            )
          }
        />

        <Route path="/check-status" element={<CheckStatus />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="create-job" element={<JobF />} />
          <Route path="add-technician" element={<AddTechnician />} />
          <Route path="all-jobs" element={<AllJobs />} />
          <Route path="modify-jobs" element={<ModifyJobs />} />
          <Route path="/admin/notifications" element={<NotificationPanel />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
