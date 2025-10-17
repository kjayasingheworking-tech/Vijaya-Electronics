import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import "../../styles/sales.css";
import { CreditCard, FileText, DollarSign, AlertTriangle, CheckCircle, Clock, Banknote, CreditCard as CardIcon } from "lucide-react";
import { API, API_ENDPOINTS } from "../../constants/salesApi";
import { getCustomerDisplayData } from "../../utils/customerDataUtils";

const PaymentHistory = () => {
  const { customerId } = useParams();
  const [paymentHistory, setPaymentHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}${API_ENDPOINTS.PAYMENT_HISTORY_BY_CUSTOMER(customerId)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }
      
      const data = await response.json();
      setPaymentHistory(data);
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchPaymentHistory();
    }
  }, [customerId, fetchPaymentHistory]);

  const formatCurrency = (amount) => {
    return `Rs.${amount?.toFixed(2) || '0.00'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Cleared":
      case "Paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Bounced":
      case "Overdue":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case "Cleared":
      case "Paid":
      case "Completed":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "Pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "Bounced":
      case "Overdue":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading payment history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Payment History Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!paymentHistory) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No payment history data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-gray-600">{getCustomerDisplayData(paymentHistory.customer).name} ({getCustomerDisplayData(paymentHistory.customer).email})</p>
        </div>
      </div>

      {/* Cash History Section */}
      {paymentHistory.cashHistory && paymentHistory.cashHistory.totalCashPayments > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Cash Payment History</h3>
          </div>
          
          {/* Cash Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{paymentHistory.cashHistory.totalCashPayments}</div>
              <div className="text-sm text-gray-600">Total Cash Payments</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(paymentHistory.cashHistory.totalCashAmount)}</div>
              <div className="text-sm text-gray-600">Total Cash Amount</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(paymentHistory.cashHistory.averageCashAmount)}</div>
              <div className="text-sm text-gray-600">Average Amount</div>
            </div>
          </div>

          {/* Cash Details Table */}
          {paymentHistory.cashHistory.cashDetails && paymentHistory.cashHistory.cashDetails.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Payment Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Invoice #</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.cashHistory.cashDetails.map((cash) => (
                    <tr key={cash.id}>
                      <td className="border border-gray-300 px-4 py-2">{formatCurrency(cash.amount)}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={getStatusBadge(cash.status)}>
                          {getStatusIcon(cash.status)}
                          <span className="ml-1">{cash.status}</span>
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{formatDate(cash.createdAt)}</td>
                      <td className="border border-gray-300 px-4 py-2">{cash.invoiceNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Card History Section */}
      {paymentHistory.cardHistory && paymentHistory.cardHistory.totalCardPayments > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <CardIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Card Payment History</h3>
          </div>
          
          {/* Card Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{paymentHistory.cardHistory.totalCardPayments}</div>
              <div className="text-sm text-gray-600">Total Card Payments</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(paymentHistory.cardHistory.totalCardAmount)}</div>
              <div className="text-sm text-gray-600">Total Card Amount</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(paymentHistory.cardHistory.averageCardAmount)}</div>
              <div className="text-sm text-gray-600">Average Amount</div>
            </div>
          </div>

          {/* Card Details Table */}
          {paymentHistory.cardHistory.cardDetails && paymentHistory.cardHistory.cardDetails.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Payment Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Invoice #</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.cardHistory.cardDetails.map((card) => (
                    <tr key={card.id}>
                      <td className="border border-gray-300 px-4 py-2">{formatCurrency(card.amount)}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={getStatusBadge(card.status)}>
                          {getStatusIcon(card.status)}
                          <span className="ml-1">{card.status}</span>
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{formatDate(card.createdAt)}</td>
                      <td className="border border-gray-300 px-4 py-2">{card.invoiceNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cheque History Section */}
      {paymentHistory.chequeHistory && paymentHistory.chequeHistory.totalCheques > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Cheque Payment History</h3>
          </div>
          
          {/* Cheque Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{paymentHistory.chequeHistory.totalCheques}</div>
              <div className="text-sm text-gray-600">Total Cheques</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{paymentHistory.chequeHistory.clearedCheques}</div>
              <div className="text-sm text-gray-600">Cleared</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{paymentHistory.chequeHistory.bouncedCheques}</div>
              <div className="text-sm text-gray-600">Bounced</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{paymentHistory.chequeHistory.bounceRate}%</div>
              <div className="text-sm text-gray-600">Bounce Rate</div>
            </div>
          </div>

          {/* Cheque Details Table */}
          {paymentHistory.chequeHistory.chequeDetails && paymentHistory.chequeHistory.chequeDetails.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Cheque #</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Bank</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Issue Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Cleared Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Invoice #</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.chequeHistory.chequeDetails.map((cheque) => (
                    <tr key={cheque.id}>
                      <td className="border border-gray-300 px-4 py-2">{cheque.chequeNumber}</td>
                      <td className="border border-gray-300 px-4 py-2">{cheque.bank}</td>
                      <td className="border border-gray-300 px-4 py-2">{formatCurrency(cheque.amount)}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={getStatusBadge(cheque.status)}>
                          {getStatusIcon(cheque.status)}
                          <span className="ml-1">{cheque.status}</span>
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{formatDate(cheque.issueDate)}</td>
                      <td className="border border-gray-300 px-4 py-2">{formatDate(cheque.clearedDate)}</td>
                      <td className="border border-gray-300 px-4 py-2">{cheque.invoiceNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Credit History Section */}
      {paymentHistory.creditHistory && paymentHistory.creditHistory.totalCredits > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Credit Payment History</h3>
          </div>
          
          {/* Credit Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{paymentHistory.creditHistory.totalCredits}</div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(paymentHistory.creditHistory.creditLimit)}</div>
              <div className="text-sm text-gray-600">Credit Limit</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(paymentHistory.creditHistory.currentCreditUsed)}</div>
              <div className="text-sm text-gray-600">Used Credit</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(paymentHistory.creditHistory.creditAvailable)}</div>
              <div className="text-sm text-gray-600">Available Credit</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{paymentHistory.creditHistory.overdueRate}%</div>
              <div className="text-sm text-gray-600">Overdue Rate</div>
            </div>
          </div>

          {/* Credit Details Table */}
          {paymentHistory.creditHistory.creditDetails && paymentHistory.creditHistory.creditDetails.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Due Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Paid Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Days Overdue</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Invoice #</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.creditHistory.creditDetails.map((credit) => (
                    <tr key={credit.id}>
                      <td className="border border-gray-300 px-4 py-2">{formatCurrency(credit.amount)}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={getStatusBadge(credit.status)}>
                          {getStatusIcon(credit.status)}
                          <span className="ml-1">{credit.status}</span>
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{formatDate(credit.dueDate)}</td>
                      <td className="border border-gray-300 px-4 py-2">{formatDate(credit.paidDate)}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {credit.daysOverdue > 0 ? (
                          <span className="text-red-600 font-semibold">{credit.daysOverdue} days</span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{credit.invoiceNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* No Payment History Message */}
      {(!paymentHistory.cashHistory || paymentHistory.cashHistory.totalCashPayments === 0) &&
       (!paymentHistory.cardHistory || paymentHistory.cardHistory.totalCardPayments === 0) &&
       (!paymentHistory.chequeHistory || paymentHistory.chequeHistory.totalCheques === 0) && 
       (!paymentHistory.creditHistory || paymentHistory.creditHistory.totalCredits === 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment History</h3>
            <p className="text-gray-500">This customer hasn't made any payments yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
