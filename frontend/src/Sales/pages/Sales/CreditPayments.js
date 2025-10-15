import { useState, useEffect } from "react";
import { Eye, DollarSign } from "lucide-react";
import "../../styles/sales.css";
import { API, API_ENDPOINTS } from "../../constants/salesApi";

const CreditPayments = () => {
  const [creditPayments, setCreditPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch credit payments
  useEffect(() => {
    fetchCreditPayments();
  }, []);

  const fetchCreditPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}${API_ENDPOINTS.PAYMENTS}/credit`);
      if (!response.ok) {
        throw new Error("Failed to fetch credit payments");
      }
      const data = await response.json();
      setCreditPayments(data);
    } catch (error) {
      console.error("Error fetching credit payments:", error);
      alert("Error loading credit payments");
    } finally {
      setLoading(false);
    }
  };

  // Update credit payment status
  const updatePaymentStatus = async (paymentId, status) => {
    try {
      const response = await fetch(`${API}${API_ENDPOINTS.PAYMENTS}/credit/${paymentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }

      const result = await response.json();
      alert(result.message);
      
      // Refresh payments list
      fetchCreditPayments();
      
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Error updating payment status");
    }
  };

  // Filter credit payments
  const filteredPayments = creditPayments.filter(payment => {
    const customerMatch = payment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = filterStatus === "all" || payment.creditDetails?.status === filterStatus;
    
    return customerMatch && statusMatch;
  });

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Credit Payments</h2>
        <div className="text-sm text-gray-600">
          Total: {creditPayments.length} payments
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredPayments.length} of {creditPayments.length} credit payments
      </div>

      {/* Credit Payments List */}
      {loading ? (
        <p>Loading credit payments...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => {
              const daysUntilDue = getDaysUntilDue(payment.creditDetails?.dueDate);
              const isOverdue = daysUntilDue < 0;
              
              return (
                <div key={payment._id} className="bg-white shadow rounded-lg p-4 hover:shadow-md transition">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Credit Payment
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(payment.creditDetails?.status)}`}>
                      {payment.creditDetails?.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">
                      {payment.customer?.name || "Unknown Customer"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.customer?.email}
                    </p>
                  </div>

                  {/* Invoice Number */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Invoice Number</p>
                    <p className="font-medium text-gray-900">
                      {payment.invoice?.invoiceNumber || "N/A"}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-lg font-bold text-gray-900">
                      Rs.{payment.amount?.toFixed(2)}
                    </p>
                  </div>

                  {/* Due Date */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(payment.creditDetails?.dueDate).toLocaleDateString()}
                    </p>
                    {payment.creditDetails?.status === "Pending" && (
                      <p className={`text-xs ${isOverdue ? "text-red-600" : "text-yellow-600"}`}>
                        {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days remaining`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="p-2 border rounded hover:bg-gray-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {payment.creditDetails?.status === "Pending" && (
                      <button
                        onClick={() => updatePaymentStatus(payment._id, "Paid")}
                        className="btn-success btn-sm"
                        title="Mark as Paid"
                      >
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">
                {creditPayments.length === 0 ? "No credit payments found" : "No payments match your search criteria"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Credit Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-500 text-xl hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Customer:</span>
                  <p className="text-gray-900">{selectedPayment.customer?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{selectedPayment.customer?.email}</p>
                </div>
              </div>

              {/* Invoice Number */}
              <div>
                <span className="font-medium text-gray-600">Invoice Number:</span>
                <p className="text-gray-900">{selectedPayment.invoice?.invoiceNumber || "N/A"}</p>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Amount:</span>
                  <p className="text-lg font-bold text-gray-900">
                    Rs.{selectedPayment.amount?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadge(selectedPayment.creditDetails?.status)}`}>
                    {selectedPayment.creditDetails?.status}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Due Date:</span>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.creditDetails?.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created:</span>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Paid Date */}
              {selectedPayment.creditDetails?.paidDate && (
                <div>
                  <span className="font-medium text-gray-600">Paid Date:</span>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.creditDetails.paidDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Close
                </button>
                
                {selectedPayment.creditDetails?.status === "Pending" && (
                  <button
                    onClick={() => {
                      updatePaymentStatus(selectedPayment._id, "Paid");
                      setSelectedPayment(null);
                    }}
                    className="btn-success"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditPayments;
