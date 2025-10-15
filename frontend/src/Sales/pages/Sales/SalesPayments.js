import { useState, useEffect } from "react";
import { CreditCard, FileText, DollarSign, Users } from "lucide-react";
import "../../styles/sales.css";
import { useNavigate } from "react-router-dom";
import { API, API_ENDPOINTS } from "../../constants/salesApi";
import { ROUTES } from "../../constants/salesRoutes";

const SalesPayments = () => {
  const navigate = useNavigate();
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");

  // Filter payments based on search and filter criteria
  const filteredPayments = recentPayments.filter(payment => {
    // Check if payment matches search term
    const customerName = payment.customer?.name?.toLowerCase() || "";
    const customerEmail = payment.customer?.email?.toLowerCase() || "";
    const invoiceNumber = payment.invoice?.invoiceNumber?.toLowerCase() || "";
    const searchMatch = customerName.includes(searchTerm.toLowerCase()) ||
      customerEmail.includes(searchTerm.toLowerCase()) ||
      invoiceNumber.includes(searchTerm.toLowerCase());

    // Check if payment matches status filter
    const statusMatch = filterStatus === "all" || payment.status === filterStatus;

    // Check if payment matches method filter
    const methodMatch = filterMethod === "all" || payment.paymentMethod?.toLowerCase() === filterMethod.toLowerCase();

    // Payment is shown if it matches all filters
    return searchMatch && statusMatch && methodMatch;
  });

  const paymentStats = {
    totalPayments: recentPayments.length,
    pendingPayments: recentPayments.filter(p => p.status === "Pending").length,
    overduePayments: recentPayments.filter(p => p.status === "Overdue").length,
    totalAmount: recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  // Fetch recent payments
  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      setLoading(true);

      // Fetch all invoices (which contain all payment information)
      const invoicesResponse = await fetch(`${API}${API_ENDPOINTS.INVOICES}`);
      const invoices = invoicesResponse.ok ? await invoicesResponse.json() : [];

      // Convert invoices to payment format for display
      const allPayments = invoices.map(invoice => {
        // Get customer information from customerSnapshot (which should always be present)
        const customerInfo = invoice.customerSnapshot || {};

        return {
          _id: invoice._id,
          customer: {
            name: customerInfo.name || "Walk-in Customer",
            email: customerInfo.email || ""
          },
          invoice: {
            invoiceNumber: invoice.invoiceNumber
          },
          paymentMethod: invoice.paymentMethod || "Cash",
          amount: invoice.totalAmount || 0,
          status: invoice.status || "Pending",
          displayDate: invoice.createdAt,
          // Additional details for credit/cheque payments
          creditDetails: invoice.paymentMethod === "Credit" ? {
            status: invoice.status,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from creation
          } : null,
          chequeDetails: invoice.paymentMethod === "Cheque" ? {
            status: invoice.status,
            chequeNumber: invoice.paymentDetails?.chequeNumber || "N/A",
            bank: invoice.paymentDetails?.bank || "N/A"
          } : null
        };
      });

      // Sort by creation date (newest first) - show ALL payments, not just 15
      const sortedPayments = allPayments
        .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));

      setRecentPayments(sortedPayments);
    } catch (error) {
      console.error("Error fetching recent payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToCredit = () => {
    navigate(ROUTES.SALES_CREDIT_PAYMENTS);
  };

  const handleNavigateToCheque = () => {
    navigate(ROUTES.SALES_CHEQUE_PAYMENTS);
  };

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Management</h2>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by customer name, email, or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-[140px]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="min-w-[140px]">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Credit">Credit</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{paymentStats.totalPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{paymentStats.pendingPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
              <p className="text-2xl font-bold text-gray-900">{paymentStats.overduePayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">Rs.{paymentStats.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Payments Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-honeycomb-orange mr-3" />
            <h3 className="text-lg font-semibold">Credit Payment Management</h3>
          </div>

          <p className="text-gray-600 mb-4">
            Manage credit payments for wholesale customers. Track credit limits,
            payment periods, and overdue accounts.
          </p>

          <button
            onClick={handleNavigateToCredit}
            className="px-4 py-2 bg-honeycomb-orange hover:bg-orange-400 transition text-white rounded-lg font-medium w-full"
          >
            Manage Credit Payments
          </button>
        </div>

        {/* Cheque Payments Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-electric-blue mr-3" />
            <h3 className="text-lg font-semibold">Cheque Payment Management</h3>
          </div>

          <p className="text-gray-600 mb-4">
            Process cheque payments from wholesale customers. Track cheque status
            and manage customer blocking during processing.
          </p>

          <button
            onClick={handleNavigateToCheque}
            className="px-4 py-2 bg-electric-blue hover:bg-electric-blue-dark transition text-white rounded-lg font-medium w-full"
          >
            Manage Cheque Payments
          </button>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Payments</h3>
            <div className="text-sm text-gray-500">
              Showing {filteredPayments.length} of {recentPayments.length} payments
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.customer?.name || "Walk-in Customer"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.customer?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.invoice?.invoiceNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${payment.paymentMethod === "Credit"
                          ? "bg-blue-100 text-blue-800"
                          : payment.paymentMethod === "Cheque"
                            ? "bg-green-100 text-green-800"
                            : payment.paymentMethod === "Card"
                              ? "bg-purple-100 text-purple-800"
                              : payment.paymentMethod === "Cash"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rs.{payment.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${payment.status === "Paid" || payment.status === "Cleared"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "Overdue" || payment.status === "Bounced" || payment.status === "Unpaid"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.displayDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || filterStatus !== "all" || filterMethod !== "all"
                      ? "No payments match your search criteria. Try adjusting your filters."
                      : "No payments found. Create some invoices to see them here."
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesPayments;
