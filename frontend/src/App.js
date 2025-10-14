import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import { ToastProvider } from './components/ToastProvider'; // ⬅️ add this

import Navbar from './components/Navbar';
import CustomerHome from './pages/CustomerHome';
import AdminDashboard from './pages/DashboardAdmin';
import SupplierManagement from './pages/admin/SupplierManagement';
import DashboardSupplier from './pages/DashboardSupplier';

import NotFound from './pages/NotFound';
import MyProducts from './pages/supplier/MyProducts';
import ProductsAdmin from './pages/admin/ProductsAdmin';
import POListAdmin from './pages/admin/POListAdmin';
import PODetailAdmin from './pages/admin/PODetailAdmin';
import OrdersPage from './pages/supplier/OrdersPage';
import OrderView from './pages/supplier/OrderView';
import AllNotifications from './pages/notifications/AllNotifications';
import InvoicesAdmin from './pages/admin/InvoicesAdmin';
import InvoiceDetailAdmin from './pages/admin/InvoiceDetailAdmin';
import DamageInquiriesAdmin from './pages/admin/DamageInquiriesAdmin';
import DamageInquiryDetailAdmin from './pages/admin/DamageInquiryDetailAdmin';
import InvoicesList from './pages/supplier/InvoicesList';
import InvoiceView from './pages/supplier/InvoiceView';
import AboutUs from "./pages/customer/AboutUs";
import CustomerTicketsPage from './pages/customer/CustomerTicketsPage';
import TicketDetailCustomer from './pages/customer/TicketDetailCustomer';
import AdminTicketsList from './pages/admin/AdminTicketsList';
import AdminTicketDetail from './pages/admin/AdminTicketDetail';
import MySupProfile from './pages/supplier/MySupProfile';
import MyProfile from "./pages/customer/MyProfile";
import CustomersList from './pages/admin/CustomersList';




export default function App() {

  return (
    <AuthProvider>
      <ToastProvider>{/* ⬅️ wrap the whole app so useToast works anywhere */}
        <Navbar />
        <Routes>
          <Route path="/" element={<CustomerHome />} />
          <Route path="/notifications" element={<AllNotifications />} />
          

          {/* Supplier pages */}

          <Route path="/supplier" element={
            <ProtectedRoute roles={['supplier']}><DashboardSupplier/></ProtectedRoute>
          }/>
          <Route path="/supplier/myproducts" element={
            <ProtectedRoute roles={['supplier']}><MyProducts/></ProtectedRoute>
          }/>
          <Route path="/supplier/orders" element={
            <ProtectedRoute roles={['supplier']}><OrdersPage/></ProtectedRoute>
          }/>
          <Route path="/supplier/orders/:id" element={
            <ProtectedRoute roles={['supplier']}><OrderView/></ProtectedRoute>
          }/>
          <Route path="/supplier/invoices" element={
            <ProtectedRoute roles={['supplier']}><InvoicesList/></ProtectedRoute>
          }/>
          <Route path="/supplier/invoices/:id" element={
            <ProtectedRoute roles={['supplier']}><InvoiceView/></ProtectedRoute>
          }/>
          <Route path="/supplier/profile" element={
              <ProtectedRoute roles={['supplier']}><MySupProfile/></ProtectedRoute>
          }/>
          

          {/* Admin pages */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard/></ProtectedRoute>
          }/>
          <Route path="/admin/suppliers" element={
            <ProtectedRoute roles={['admin']}><SupplierManagement/></ProtectedRoute>
          }/>
          <Route path="/admin/products" element={
            <ProtectedRoute roles={['admin']}><ProductsAdmin/></ProtectedRoute>
          }/>
          <Route path="/admin/purchase-orders" element={
            <ProtectedRoute roles={['admin']}><POListAdmin/></ProtectedRoute>
          }/>
          <Route path="/admin/purchase-orders/:id" element={
            <ProtectedRoute roles={['admin']}><PODetailAdmin/></ProtectedRoute>
          }/>
          <Route path="/admin/invoices" element={
            <ProtectedRoute roles={['admin']}><InvoicesAdmin/></ProtectedRoute>
          }/>
          <Route path="/admin/invoices/:id" element={
            <ProtectedRoute roles={['admin']}><InvoiceDetailAdmin/></ProtectedRoute>
          }/>
          <Route path="/admin/damage-inquiries" element={
            <ProtectedRoute roles={['admin']}><DamageInquiriesAdmin/></ProtectedRoute>
          }/>
          <Route path="/admin/damage-inquiries/:id" element={
            <ProtectedRoute roles={['admin']}><DamageInquiryDetailAdmin/></ProtectedRoute>
          }/>
          <Route path="/admin/tickets" element={<ProtectedRoute roles={['admin']}><AdminTicketsList/></ProtectedRoute>} />
            <Route path="/admin/tickets/:id" element={<ProtectedRoute roles={['admin']}><AdminTicketDetail/></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute roles={['admin']}><CustomersList/></ProtectedRoute>} />

          <Route path="/about" element={<AboutUs />} />
          <Route path="/customer/tickets" element={<CustomerTicketsPage/>} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/customer/tickets/:id" element={<ProtectedRoute roles={['customer']}><TicketDetailCustomer/></ProtectedRoute>} />


          <Route path="*" element={<NotFound/>} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
