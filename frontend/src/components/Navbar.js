import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemo, useState } from 'react';
import LoginModal from './LoginModal';
import '../styles/Navbar.css';
import NotificationsBell from '../components/common/NotificationsBell';
import NotificationsModal from '../components/common/NotificationsModal';



export default function Navbar(){
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const homePath = useMemo(() => {
    if (!user) return '/';
    if (user.role === 'customer') return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'supplier') return '/supplier';
    if (user.role === 'repair_manager') return '/repair/admin';
    if (user.role === 'sales_manager') return '/sales';
    return '/';
  }, [user]);

const location = useLocation();
const isSuppliersActive = location.pathname.startsWith("/admin/suppliers");
const isProductsActive = location.pathname.startsWith("/admin/products");
const isPOsActive = location.pathname.startsWith("/admin/purchase-orders");
const isInvoicesActive = location.pathname.startsWith("/admin/invoices");
  const isTicketsActive = location.pathname.startsWith("/admin/tickets");

  const isHomeActive =
    loc.pathname === homePath ||
    (homePath !== '/' && loc.pathname.startsWith(homePath + '/'));

  const isSupplierProActive = loc.pathname === '/supplier/myproducts';
  const isCustomerTicketsActive = loc.pathname.startsWith("/customer/tickets");
  const isSupplierProfileActive = loc.pathname.startsWith("/supplier/profile");

  return (
  <header className="nav">
    <div className="brand">
      <img 
        src="/vijayaElectronics.jpg" 
        alt="Vijaya Electronics" 
        style={{
          height: '40px',
          width: 'auto',
          marginRight: '10px',
          borderRadius: '4px'
        }}
      />
      Vijaya Electronics
    </div>

    <nav>
      <Link to={homePath} className={isHomeActive ? 'active' : ''}>Home</Link>

    {/* Admin-only */}
    {user?.role === "admin" && (
      <>
        <Link
          to="/admin/suppliers"
          className={isSuppliersActive ? "active" : ""}
        >
          Suppliers
        </Link>
        <Link
          to="/admin/products"
          className={isProductsActive ? "active" : ""}
        >
          Products
        </Link>
        <Link
          to="/admin/purchase-orders"
          className={isPOsActive ? "active" : ""}
        >
          Purchase Orders
        </Link>
        <Link
          to="/admin/invoices"
          className={isInvoicesActive ? "active" : ""}
        >
          Invoices
        </Link>
         <Link to="/admin/damage-inquiries" className={loc.pathname.startsWith("/admin/damage-inquiries") ? "active" : ""}>
          Damage Inquiries
          </Link>

           <Link
              to="/admin/tickets" className={isTicketsActive ? "active" : ""}>
              Tickets
            </Link>

          <Link to="/admin/customers" className={loc.pathname.startsWith("/admin/customers") ? "active" : ""}>
          Customers
          </Link>
      </>
    )}

      {/* Repair Manager */}
      {user?.role === 'repair_manager' && (
        <>
          <Link to="/repair/admin/create-job" className={loc.pathname.startsWith("/repair/admin/create-job") ? "active" : ""}>
            Create Job
          </Link>
          <Link to="/repair/admin/all-jobs" className={loc.pathname.startsWith("/repair/admin/all-jobs") ? "active" : ""}>
            All Jobs
          </Link>
          <Link to="/repair/admin/modify-jobs" className={loc.pathname.startsWith("/repair/admin/modify-jobs") ? "active" : ""}>
            Modify Jobs
          </Link>
          <Link to="/repair/admin/add-technician" className={loc.pathname.startsWith("/repair/admin/add-technician") ? "active" : ""}>
            Technicians
          </Link>
          <Link to="/repair/check-status" className={loc.pathname.startsWith("/repair/check-status") ? "active" : ""}>
            Check Status
          </Link>
        </>
      )}


      {/* Supplier-only */}
      {user?.role === 'supplier' && (
        <>
          <Link to="/supplier/myproducts" className={isSupplierProActive ? "active" : ""}>My products</Link>
          <Link to="/supplier/orders" className={loc.pathname.startsWith("/supplier/orders") ? "active" : ""}>
            Orders
          </Link>

          <Link to="/supplier/invoices" className={loc.pathname.startsWith("/supplier/invoices") ? "active" : ""}>
            Invoices
          </Link>
            <Link
              to="/supplier/profile"
              className={isSupplierProfileActive ? "active" : ""}
            >
              My Profile
            </Link>
        </>
      )}

     {/* About Us: visible only for guests and customers */}
    {(!user || user?.role === 'customer') && (
      <>
      <Link to="/customer/products" className={loc.pathname === "/customer/products" ? "active" : ""}>
        Products
      </Link>
      <Link to="/about" className={loc.pathname === "/about" ? "active" : ""}>
        About Us
      </Link>
       <Link to="/customer/tickets"  className={isCustomerTicketsActive ? "active" : ""}>
              My Tickets
      </Link>
      <Link to="/repair" className={loc.pathname === "/repair" || loc.pathname === "/repair/" ? "active" : ""}>
        My Repairs
      </Link>
           
        <Link to="/profile" >
          My Profile
        </Link>
      
      
      
      </>
    )}

     

    </nav>

    <div className="rightTools">
      {user ? (
        <>
          {/* Cart icon for customers */}
          {user.role === 'customer' && (
            <Link 
              to="/customer/cart" 
              style={{
                position: 'relative',
                marginRight: '15px',
                fontSize: '24px',
                color: '#0057B8',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Shopping Cart"
            >
              🛒
            </Link>
          )}
          <NotificationsBell onOpenModal={() => setNotifOpen(true)} />
          <button onClick={logout} className="logout">Logout</button>
        </>
      ) : (
        <>
          {/* Cart icon for guests */}
          <Link 
            to="/customer/cart" 
            style={{
              position: 'relative',
              marginRight: '15px',
              fontSize: '24px',
              color: '#0057B8',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Shopping Cart"
          >
            🛒
          </Link>
          <button className="loginBtn" onClick={() => setOpen(true)}>Login</button>
        </>
      )}
    </div>

    <LoginModal open={open} onClose={() => setOpen(false)} />
       <NotificationsModal open={notifOpen} onClose={() => setNotifOpen(false)} />
  </header>
);

}
