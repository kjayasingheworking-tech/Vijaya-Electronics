import { useEffect, useState, useCallback } from "react";
import ModalWrapper from "../../ModalWrapper";
import "../../../styles/sales.css";

import { API, API_ENDPOINTS } from "../../../constants/salesApi";
import { getCustomerDisplayData } from "../../../utils/customerDataUtils";

const ViewCustomer = ({ customer, onClose, onCustomerUpdate, onEdit }) => {
  const [customerDetails, setCustomerDetails] = useState(null);
  const [claimedDiscounts, setClaimedDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch detailed customer information
      const customerRes = await fetch(`${API}${API_ENDPOINTS.CUSTOMER_BY_ID(customer._id)}`);
      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomerDetails(customerData);
        
        // Fetch claimed discounts if any
        if (customerData.claimedDiscounts && customerData.claimedDiscounts.length > 0) {
          const discountPromises = customerData.claimedDiscounts.map(discountId => 
            fetch(`${API}${API_ENDPOINTS.DISCOUNT_BY_ID(discountId)}`).then(res => res.json())
          );
          
          try {
            const discounts = await Promise.all(discountPromises);
            setClaimedDiscounts(discounts.filter(d => d && !d.error));
          } catch (err) {
            console.error("Error fetching claimed discounts:", err);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching customer details:", err);
    } finally {
      setLoading(false);
    }
  }, [customer._id]);

  useEffect(() => {
    if (customer) {
      fetchCustomerDetails();
    }
  }, [customer, fetchCustomerDetails]);

  const handleBlockStatusUpdate = async (newBlockedStatus) => {
    if (!customerDetails) return;

    // Show loading state
    setUpdating(true);
    
    try {
      // Send request to server
      const response = await fetch(`${API}${API_ENDPOINTS.CUSTOMER_BLOCK_STATUS(customerDetails._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: newBlockedStatus }),
      });

      // Check if request was successful
      if (!response.ok) {
        throw new Error("Failed to update customer status");
      }

      // Get the result from server
      const result = await response.json();
      
      // Update local customer data
      setCustomerDetails(result.customer);
      
      // Tell parent component about the update
      if (onCustomerUpdate) {
        onCustomerUpdate(result.customer);
      }

      // Show success message
      alert(result.message);
      
    } catch (err) {
      console.error("Error updating customer block status:", err);
      alert(`Error: ${err.message}`);
    } finally {
      // Hide loading state
      setUpdating(false);
    }
  };


  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "Rs. 0.00";
    return `Rs. ${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusBadge = (blocked) => {
    return blocked ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Blocked
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  const getTierBadge = (tier) => {
    const colors = {
      silver: "bg-gray-100 text-gray-800",
      gold: "bg-yellow-100 text-yellow-800",
      diamond: "bg-blue-100 text-blue-800"
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tier] || colors.silver}`}>
        {tier?.charAt(0).toUpperCase() + tier?.slice(1) || "Silver"}
      </span>
    );
  };

  if (loading) {
    return (
      <ModalWrapper>
        <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading customer details...</div>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  if (!customerDetails) {
    return (
      <ModalWrapper>
        <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">Error loading customer details</div>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper>
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg p-6 space-y-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{getCustomerDisplayData(customerDetails).name}</h3>
            <p className="text-gray-600">{customerDetails.companyName || "Individual Customer"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Customer Information</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{getCustomerDisplayData(customerDetails).email}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{customerDetails.phone || "N/A"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Customer Type:</span>
                <span className="font-medium capitalize">{customerDetails.type || "Regular"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tier:</span>
                {getTierBadge(customerDetails.tier)}
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                {getStatusBadge(customerDetails.blocked)}
              </div>
              
              {/* User Information (for wholesale customers) */}
              {customerDetails.user && (
                <div className="pt-3 border-t">
                  <h5 className="font-semibold text-gray-900 mb-2">User Account</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User Role:</span>
                      <span className="font-medium capitalize">{customerDetails.user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Status:</span>
                      <span className={`font-medium ${customerDetails.user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {customerDetails.user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium">{formatDate(customerDetails.createdAt)}</span>
              </div>
            </div>

            {(customerDetails.addressLine1 || customerDetails.addressLine2 || customerDetails.city) && (
              <div>
                <span className="text-gray-600 block mb-1">Address:</span>
                <div className="text-sm bg-gray-50 p-3 rounded">
                  {customerDetails.addressLine1 && <p>{customerDetails.addressLine1}</p>}
                  {customerDetails.addressLine2 && <p>{customerDetails.addressLine2}</p>}
                  {customerDetails.city && <p>{customerDetails.city}</p>}
                </div>
              </div>
            )}

            {customerDetails.type === "wholesale" && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <h5 className="font-semibold text-gray-900">Wholesale Information</h5>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="font-medium">{formatCurrency(customerDetails.creditLimit)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Credit Used:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(customerDetails.currentCreditUsed)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Credit:</span>
                  <span className={`font-medium ${customerDetails.creditAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(customerDetails.creditAvailable)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Points & Purchase Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Points & Purchase History</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Available Points:</span>
                <span className="font-medium text-blue-600">{customerDetails.pointsBalance || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Points Earned:</span>
                <span className="font-medium">{customerDetails.totalPointsEarned || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Points Redeemed:</span>
                <span className="font-medium text-orange-600">{customerDetails.totalPointsRedeemed || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Purchase Amount:</span>
                <span className="font-medium text-green-600">{formatCurrency(customerDetails.totalPurchaseAmount)}</span>
              </div>
            </div>

            {/* Cheques (if any) */}
            {customerDetails.cheques && customerDetails.cheques.length > 0 && (
              <div className="pt-4 border-t">
                <h5 className="font-semibold text-gray-900 mb-3">Cheques ({customerDetails.cheques.length})</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {customerDetails.cheques.map((cheque, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                      <div className="flex justify-between">
                        <span>#{cheque.chequeNumber}</span>
                        <span className="font-medium">{formatCurrency(cheque.amount)}</span>
                      </div>
                      <div className="text-gray-600">
                        {cheque.bank} • {formatDate(cheque.issuedDate)} • 
                        <span className={`ml-1 capitalize ${
                          cheque.status === 'cleared' ? 'text-green-600' : 
                          cheque.status === 'bounced' ? 'text-red-600' : 
                          'text-yellow-600'
                        }`}>
                          {cheque.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Claimed Discounts */}
        {claimedDiscounts.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Claimed Discounts ({claimedDiscounts.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {claimedDiscounts.map((discount) => (
                <div key={discount._id} className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="font-medium text-blue-900">{discount.title}</h6>
                      <p className="text-sm text-blue-700">Code: {discount.code}</p>
                      {discount.description && (
                        <p className="text-xs text-blue-600 mt-1">{discount.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      discount.status === 'Active' ? 'bg-green-100 text-green-800' :
                      discount.status === 'Expired' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {discount.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    {discount.discountType === 'Percentage' 
                      ? `${discount.discountAmount}% off`
                      : `${formatCurrency(discount.discountAmount)} off`
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            {customerDetails.type === "wholesale" && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(customerDetails);
                }}
                className="btn-secondary"
              >
                Edit Customer
              </button>
            )}
            
            {customerDetails.blocked ? (
              <button
                onClick={() => handleBlockStatusUpdate(false)}
                disabled={updating}
                className="btn-success"
              >
                {updating ? "Unblocking..." : "Unblock Customer"}
              </button>
            ) : (
              <button
                onClick={() => handleBlockStatusUpdate(true)}
                disabled={updating}
                className="btn-danger"
              >
                {updating ? "Blocking..." : "Block Customer"}
              </button>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="btn-cancel"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ViewCustomer;
