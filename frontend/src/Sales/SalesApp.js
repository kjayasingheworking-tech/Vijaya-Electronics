import { Routes, Route } from "react-router-dom";
import SalesManagerLayout from "./layouts/SalesManagerLayout";
import Dashboard from "./pages/Sales/SalesDashboard"; 
import Invoices from "./pages/Sales/SalesInvoices";
import Discounts from "./pages/Sales/SalesDiscounts";
import Customer from "./pages/Sales/SalesCustomers";
import Payment from "./pages/Sales/SalesPayments";
import CreditPayments from "./pages/Sales/CreditPayments";
import ChequePayments from "./pages/Sales/ChequePayments";
import PaymentHistory from "./pages/Sales/PaymentHistory";
import Reports from "./pages/Sales/SalesReports";

function SalesApp() {
  const salesManagerId = "68e6fe7594c840643ce3918d"; // Hard-coded for testing

  return (
    <Routes>
      {/* Sales Manager routes - all under /sales */}
      <Route path="/" element={<SalesManagerLayout salesManagerId={salesManagerId}/>}>
        <Route index element={<Dashboard />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="discounts" element={<Discounts />} />
        <Route path="customers" element={<Customer />} />
        <Route path="customers/:customerId/payment-history" element={<PaymentHistory />} />
        <Route path="payments" element={<Payment />} />
        <Route path="payments/credit" element={<CreditPayments />} />
        <Route path="payments/cheque" element={<ChequePayments />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default SalesApp;
