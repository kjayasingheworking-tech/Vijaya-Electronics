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
    <aside className="w-64 bg-white border-r shadow-md min-h-screen fixed left-0 top-0 z-10 pt-20">
      <nav className="p-4 space-y-2">
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/sales"}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-md font-medium transition-colors ${isActive ? "bg-electric-blue text-white" : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >

            <Icon className="h-5 w-5" />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SalesNavigation;
