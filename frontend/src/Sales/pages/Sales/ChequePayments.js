import { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import "../../styles/sales.css";
import { API, API_ENDPOINTS } from "../../constants/salesApi";

const ChequePayments = () => {
  const [chequePayments, setChequePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState(false);

  // Fetch cheque payments
  useEffect(() => {
    fetchChequePayments();
  }, []);

  const fetchChequePayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}${API_ENDPOINTS.PAYMENTS}/cheque`);
      if (!response.ok) {
        throw new Error("Failed to fetch cheque payments");
      }
      const data = await response.json();
      setChequePayments(data);
    } catch (error) {
      console.error("Error fetching cheque payments:", error);
      alert("Error loading cheque payments");
    } finally {
      setLoading(false);
    }
  };

  // Update cheque status
  const updateChequeStatus = async (paymentId, status, clearedDate = null, bouncedReason = null) => {
    try {
      setUpdating(true);
      const response = await fetch(`${API}${API_ENDPOINTS.PAYMENTS}/cheque/${paymentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          clearedDate,
          bouncedReason
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update cheque status");
      }

      const result = await response.json();
      alert(result.message);

      // Refresh payments list
      fetchChequePayments();

    } catch (error) {
      console.error("Error updating cheque status:", error);
      alert("Error updating cheque status");
    } finally {
      setUpdating(false);
    }
  };

  // Filter cheque payments
  const filteredPayments = chequePayments.filter(payment => {
    const customerMatch = payment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.chequeDetails?.chequeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.chequeDetails?.bank?.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = filterStatus === "all" || payment.chequeDetails?.status === filterStatus;

    return customerMatch && statusMatch;
  });

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Cleared":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Bounced":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Calculate days since issue
  const getDaysSinceIssue = (issueDate) => {
    const today = new Date();
    const issue = new Date(issueDate);
    const diffTime = today - issue;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cheque Payments</h2>
        <div className="text-sm text-gray-600">
          Total: {chequePayments.length} cheques
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by customer, cheque number, or bank..."
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
            <option value="Cleared">Cleared</option>
            <option value="Bounced">Bounced</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredPayments.length} of {chequePayments.length} cheque payments
      </div>

      {/* Cheque Payments List */}
      {loading ? (
        <p>Loading cheque payments...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => {
              const daysSinceIssue = getDaysSinceIssue(payment.chequeDetails?.issueDate);

              return (
                <div key={payment._id} className="bg-white shadow rounded-lg p-4 hover:shadow-md transition">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Cheque #{payment.chequeDetails?.chequeNumber}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(payment.chequeDetails?.status)}`}>
                      {payment.chequeDetails?.status}
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

                  {/* Bank Info */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Bank</p>
                    <p className="text-sm text-gray-900">
                      {payment.chequeDetails?.bank}
                    </p>
                  </div>

                  {/* Issue Date */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Issue Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(payment.chequeDetails?.issueDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {daysSinceIssue} days ago
                    </p>
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

                    {(payment.chequeDetails?.status === "Pending" || payment.chequeDetails?.status === "Bounced") && (
                      <button
                        onClick={() => updateChequeStatus(payment._id, "Cleared", new Date().toISOString())}
                        disabled={updating}
                        className="btn-success btn-sm"
                        title="Mark as Cleared"
                      >
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Clear
                      </button>
                    )}
                    {payment.chequeDetails?.status === "Pending" && (
                      <button
                        onClick={() => {
                          const reason = prompt("Enter bounce reason:");
                          if (reason) {
                            updateChequeStatus(payment._id, "Bounced", null, reason);
                          }
                        }}
                        disabled={updating}
                        className="btn-danger btn-sm"
                        title="Mark as Bounced"
                      >
                        <XCircle className="h-4 w-4 inline mr-1" />
                        Bounce
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">
                {chequePayments.length === 0 ? "No cheque payments found" : "No payments match your search criteria"}
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
              <h3 className="text-xl font-bold">Cheque Payment Details</h3>
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

              {/* Cheque Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Cheque Number:</span>
                  <p className="text-gray-900">{selectedPayment.chequeDetails?.chequeNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Bank:</span>
                  <p className="text-gray-900">{selectedPayment.chequeDetails?.bank}</p>
                </div>
              </div>

              {/* Amount and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Amount:</span>
                  <p className="text-lg font-bold text-gray-900">
                    Rs.{selectedPayment.amount?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadge(selectedPayment.chequeDetails?.status)}`}>
                    {selectedPayment.chequeDetails?.status}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Issue Date:</span>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.chequeDetails?.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created:</span>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Cleared Date */}
              {selectedPayment.chequeDetails?.clearedDate && (
                <div>
                  <span className="font-medium text-gray-600">Cleared Date:</span>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.chequeDetails.clearedDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Bounce Reason */}
              {selectedPayment.chequeDetails?.bouncedReason && (
                <div>
                  <span className="font-medium text-gray-600">Bounce Reason:</span>
                  <p className="text-gray-900">{selectedPayment.chequeDetails.bouncedReason}</p>
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

                {selectedPayment.chequeDetails?.status === "Pending" && (
                  <>
                    <button
                      onClick={() => {
                        updateChequeStatus(selectedPayment._id, "Cleared", new Date().toISOString());
                        setSelectedPayment(null);
                      }}
                      className="btn-success"
                    >
                      Mark as Cleared
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Enter bounce reason:");
                        if (reason) {
                          updateChequeStatus(selectedPayment._id, "Bounced", null, reason);
                          setSelectedPayment(null);
                        }
                      }}
                      className="btn-danger"
                    >
                      Mark as Bounced
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChequePayments;
