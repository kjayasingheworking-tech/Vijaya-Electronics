import { Home, FileText, CreditCard, Users, BarChart2, TicketPercent } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../constants/salesRoutes.js";
import "../../styles/sales.css";

const navItems = [
  { name: "Dashboard", path: ROUTES.SALES_DASHBOARD, icon: Home },
  { name: "Invoices", path: ROUTES.SALES_INVOICES, icon: FileText },
  { name: "Payments", path: ROUTES.SALES_PAYMENTS, icon: CreditCard },
  { name: "Customers", path: ROUTES.SALES_CUSTOMERS, icon: Users },
  { name: "Discounts", path: ROUTES.SALES_DISCOUNTS, icon: TicketPercent },
  { name: "Reports", path: ROUTES.SALES_REPORTS, icon: BarChart2 },
];

const SalesNavigation = () => {

  return (
    <aside 
      style={{ 
        position: 'fixed',
        left: '0',
        top: '80px',
        width: '256px',
        height: 'calc(100vh - 80px)',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        overflowY: 'auto'
      }}
    >
      <nav style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === ROUTES.SALES_DASHBOARD}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.2s',
                color: '#374151'
              }}
              className={({ isActive }) =>
                isActive ? "sidebar-nav-active" : "sidebar-nav-inactive"
              }
            >
              <Icon size={20} />
              <span>{name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      
      <style>{`
        .sidebar-nav-active {
          background-color: #0057B8 !important;
          color: white !important;
        }
        .sidebar-nav-inactive:hover {
          background-color: #f3f4f6 !important;
        }
      `}</style>
    </aside>
  );
};

export default SalesNavigation;
