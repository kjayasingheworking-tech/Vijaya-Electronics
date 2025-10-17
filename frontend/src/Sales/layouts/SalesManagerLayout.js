import SalesHeader from "../components/Sales/SalesHeader";
import SalesNavigation from "../components/Sales/SalesNavigation";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../styles/sales.css";

const SalesManagerLayout = ({ salesManagerId }) => {
  const { user } = useAuth(); // Get user data

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] sales-layout">
      {/* Top Header - pass user data */}
      <SalesHeader salesManagerId={salesManagerId} user={user} />

      <div className="flex flex-1" style={{ marginTop: '80px' }}>
        {/* Sidebar Navigation */}
        <SalesNavigation />

        {/* Main Page Content */}
        <main 
          className="flex-1 p-4 overflow-y-auto"
          style={{ marginLeft: '256px' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SalesManagerLayout;

