import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Landing from "./components/LandPage/Landing";
import CheckStatus from "./components/Status/CheckStatus";
import JobF from "./components/JobF/JobForm";
import AddTechnician from "./components/AddTechnicians/AddTechnician";
import AdminDashboard from "./components/admin/AdminDashboard";
import AllJobs from "./components/admin/AllJobs";
import ModifyJobs from "./components/admin/ModifyJobs";
import NotificationPanel from "./components/admin/NotificationPanel";

// Helper to get user from main auth system
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("electra_user") || "null");
  } catch {
    return null;
  }
}

//Role protection wrapper for Repair module internal routes
function ProtectedRoute({ children, allowedRoles }) {
  const user = getUser();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    alert("Please login to access this page.");
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    alert("Access denied. You must be an admin or repair manager to view this page.");
    return <Navigate to="/repair" replace />;
  }

  return children;
}

function App() {
  const user = getUser();
  const userRole = user?.role;

  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            userRole === "repair_manager" || userRole === "admin" ? (
              <Navigate to="/repair/admin" replace />
            ) : (
              <Landing />
            )
          }
        />

        <Route path="/check-status" element={<CheckStatus />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "repair_manager"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<AllJobs />} />
          <Route path="create-job" element={<JobF />} />
          <Route path="add-technician" element={<AddTechnician />} />
          <Route path="all-jobs" element={<AllJobs />} />
          <Route path="modify-jobs" element={<ModifyJobs />} />
          <Route path="notifications" element={<NotificationPanel />} />
        </Route>

        <Route path="*" element={<Navigate to="/repair" replace />} />
      </Routes>
    </div>
  );
}

export default App;
