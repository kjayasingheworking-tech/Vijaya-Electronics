import { useEffect, useState, useCallback } from "react";
import "../../styles/customer-dark.css";
import { 
  validateRedeemPoints, 
  validateCustomerAccount, 
  validateDiscountCode,
  validateCartStock,
  getStockStatus,
  minTotal 
} from "../../utils/validation";
import { API, API_ENDPOINTS } from "../../constants/salesApi";
import PaymentModal from "./PaymentModal";
import { getCustomerDisplayData } from "../../utils/customerDataUtils";

const CheckoutModal = ({ customerId, cart, onClose, onSuccess }) => {
  const [customer, setCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [useRedeem, setUseRedeem] = useState(false);
  const [error, setError] = useState("");

  // discount state
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(null); // { _id, discountType, discountAmount, code }
  const [discountMessage, setDiscountMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment flow state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [invoice, setInvoice] = useState(null);

  const subtotal = (cart.items || []).reduce(
    (s, it) => {
      // Handle both unitPrice (direct) and productId.price (populated) cases
      const price = it.unitPrice || (it.productId && it.productId.price) || 0;
      return s + (price * it.quantity);
    },
    0
  );


  // Calculate discount amount
  const computedDiscount = (() => {
    if (!discount) return 0;
    
    if (discount.discountType === "Percentage") {
      return (subtotal * (discount.discountAmount || 0)) / 100;
    } else {
      return discount.discountAmount || 0;
    }
  })();

  // Calculate final total
  const estimatedTotal = Math.max(subtotal - computedDiscount - (useRedeem ? pointsToRedeem : 0), 0);

  // Calculate the maximum redeemable points
  const getMaxRedeemablePoints = useCallback(() => {
    const maxBalance = pointsBalance;
    const maxSubtotal = subtotal - computedDiscount - minTotal;
    
    // Take the smaller of the two limits
    const max = Math.min(maxBalance, maxSubtotal);
    return Math.max(0, max); // Return 0 if negative
  }, [pointsBalance, subtotal, computedDiscount]);

  // Fetch customer details on mount or when customerId changes
  useEffect(() => {
    fetch(`${API}${API_ENDPOINTS.CUSTOMER_BY_ID(customerId)}`)
      .then((r) => r.json())
      .then((c) => {
        setCustomer(c);
        setPointsBalance(c.pointsBalance || 0);

        // Check if customer account is valid
        const customerError = validateCustomerAccount(c);
        if (customerError) {
          setError(customerError);
          return;
        }

        // If redeem is already checked, prefill properly
        if (useRedeem) {
          setPointsToRedeem(getMaxRedeemablePoints());
          setError(""); // reset any previous error
        }
      })
      .catch((e) => console.error(e));
  }, [customerId, subtotal, useRedeem, getMaxRedeemablePoints]);
  
  const applyDiscount = async () => {
    // Validate discount code format first
    const codeError = validateDiscountCode(discountCode);
    if (codeError) {
      setDiscountMessage(codeError);
      return;
    }

    setDiscountMessage("");
    setApplying(true);
    try {
      const res = await fetch(`${API}${API_ENDPOINTS.DISCOUNT_REDEEM}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: discountCode.trim(), 
          customerTier: (customer?.tier || "").charAt(0).toUpperCase() + (customer?.tier || "").slice(1),
          customerId: customerId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscount(null);
        setDiscountMessage(data.message || "Invalid discount code");
        return;
      }
      setDiscount(data.discount);
      setDiscountMessage("Discount applied");
    } catch (e) {
      setDiscountMessage("Error applying discount");
    } finally {
      setApplying(false);
    }
  };



  const handlePointsChange = (value) => {
    const num = Number(value);

    const errorMsg = validateRedeemPoints(num, pointsBalance, subtotal, computedDiscount);
    if (errorMsg) {
      setError(errorMsg);
      setPointsToRedeem(getMaxRedeemablePoints());
      return;
    }
    setError("");
    setPointsToRedeem(num);
  };


  const toggleRedeem = () => {
    if (!useRedeem) {
      const safePoints = getMaxRedeemablePoints();
      setPointsToRedeem(safePoints);
      const pointsError = validateRedeemPoints(safePoints, pointsBalance, subtotal, computedDiscount);
      setError(pointsError);
    } else {
      setPointsToRedeem(0);
      setError("");
    }
    setUseRedeem(!useRedeem);
  };


  const handleSubmit = async () => {
    if (error) return alert(error);
    
    // Use centralized cart validation
    const cartValidation = validateCartStock(cart.items || []);
    if (!cartValidation.isValid) {
      alert(cartValidation.summaryMessage);
      return;
    }
    
    setSubmitting(true);
    try {
      // Prepare checkout without creating invoice
      const payload = {
        customerId,
        pointsToRedeem: useRedeem ? Number(pointsToRedeem) : 0,
        // discount payload
        discountPercent: discount?.discountType === "Percentage" ? (discount.discountAmount || 0) : 0,
        discountAmount: discount?.discountType === "Amount" ? (discount.discountAmount || 0) : 0,
        discountType: discount?.discountType || "Percentage",
        discountDescription: discount?.description || "",
        discountId: discount?._id || null,
        selectedItemIds: cart.items.map(i => i._id),
      };
      
      const res = await fetch(`${API}${API_ENDPOINTS.PAYMENT_PREPARE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Checkout preparation failed");
      }
      
      const data = await res.json();
      setCheckoutSession(data);
      
      // Handle different payment methods
      if (paymentMethod === "Cash") {
        await completePayment(data.sessionId, "Cash", {}); // For cash, complete payment immediately
      } else if (paymentMethod === "Card") {
        setShowPaymentModal(true); // For card, show payment modal
      }
      
    } catch (err) {
      alert("Checkout error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  //handle payment
  const completePayment = async (sessionId, paymentMethod, paymentDetails) => {
    try {
      const res = await fetch(`${API}${API_ENDPOINTS.PAYMENT_COMPLETE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          paymentMethod,
          paymentDetails
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Payment completion failed");
      }
      
      const data = await res.json();
      setInvoice(data.invoice);
      onSuccess && onSuccess(data);
    } catch (err) {
      console.error("Payment error:", err.message);
      alert("Payment error: " + err.message);
    }
  };

  const handlePaymentSuccess = async () => {
    if (checkoutSession) {
      await completePayment(checkoutSession.sessionId, "Card", {});
    }
    setShowPaymentModal(false);
  };

  const handlePaymentCancel = async () => {
    if (checkoutSession) {
      // Cancel the payment session
      await fetch(`${API}${API_ENDPOINTS.PAYMENT_CANCEL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: checkoutSession.sessionId }),
      });
    }
    setShowPaymentModal(false);
    setCheckoutSession(null);
  };

  // Show invoice if payment was successful
  if (invoice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white w-full max-w-2xl rounded shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-green-600">Payment Successful!</h3>
            <button onClick={onClose} className="text-gray-500 text-xl">✕</button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <h4 className="font-semibold text-green-800">Invoice Generated</h4>
            </div>
            <p className="text-green-700 text-sm">
              Invoice #{invoice.invoiceNumber || invoice._id.slice(-8)} has been created successfully.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Customer:</span>
                <p className="text-gray-900">{invoice.customerSnapshot?.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Payment Method:</span>
                <p className="text-gray-900 capitalize">{invoice.paymentMethod}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total Amount:</span>
                <p className="text-gray-900 font-semibold">Rs. {invoice.totalAmount?.toFixed(2)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <p className="text-green-600 font-semibold">{invoice.status}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-900 mb-2">Items Purchased:</h5>
              <div className="space-y-2">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="font-medium">Rs. {item.total?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="customer-modal w-full max-w-xl rounded shadow p-6">
          <div className="modal-header flex justify-between items-center pb-4">
            <h3 className="modal-title text-xl font-bold">Checkout</h3>
            <button onClick={onClose} className="modal-close text-xl">✕</button>
          </div>
        <div className="text-sm text-gray-300 mb-4">
          You have {pointsBalance} User Points
        </div>

        {customer ? (
          <>
            {/* Blocked Customer Warning */}
            {customer.blocked && (
              <div className="customer-error mb-4 p-3 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium">
                    ⚠️ Your account is blocked and you cannot place orders. Please contact support.
                  </span>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <div className="font-medium text-white">Payment Method</div>
              <select
                className="customer-select border p-2 rounded w-full"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>

            {/* Discount code */}
            <div className="mb-4">
              <div className="font-medium mb-2 text-white">Discount code</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="customer-input border p-2 rounded w-full"
                  placeholder="Enter code"
                />
                <button
                  onClick={applyDiscount}
                  disabled={applying}
                  className="customer-btn-primary flex items-center gap-2 px-4 py-2 rounded transition"
                >
                  {applying ? "Applying..." : "Apply"}
                </button>
              </div>
              {discountMessage && (
                <p className={`text-xs mt-1 ${discount ? "text-green-400" : "text-red-400"}`}>
                  {discountMessage}
                </p>
              )}
              {discount && (
                <p className="text-xs text-gray-400 mt-1">
                  Applied: {discount.code} ({discount.discountType === "Percentage" ? `${discount.discountAmount}%` : `Rs.${discount.discountAmount}`})
                </p>
              )}
            </div>

            {/* Redeem points option */}
            <div className="mb-4">
              <div className="mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useRedeem}
                    onChange={toggleRedeem}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-white">Use redeem points</span>
                </label>
              </div>

              <input
                type="number"
                min="0"
                max={pointsBalance}
                value={pointsToRedeem}
                onChange={(e) => handlePointsChange(e.target.value)}
                disabled={!useRedeem}
                className={`customer-input border p-2 rounded no-spinner w-full ${!useRedeem ? "bg-gray-700 cursor-not-allowed" : ""
                  } ${error ? "border-red-500" : ""}`}
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              {useRedeem && (
                <p className="text-xs text-gray-400 mt-1">
                  Conversion: 1 point = Rs.1
                </p>
              )}
            </div>

            {/* Cart items list */}
            <div className="mb-4">
              <h4 className="font-medium mb-2 text-white">Cart</h4>
              <div className="divide-y border border-gray-600 rounded">
                {(cart.items || []).map((it) => {
                  const stockStatus = getStockStatus(it);
                  
                  return (
                    <div key={it._id} className={`flex justify-between items-center p-2 ${stockStatus.statusType === 'error' ? 'bg-red-900/20 border-red-400' : ''}`}>
                      <div>
                        <div className="font-medium text-white">{it.name}</div>
                        <div className="text-xs text-gray-400">
                          Qty: {it.quantity} × Rs.{it.unitPrice}
                        </div>
                        {stockStatus.statusType === 'error' && (
                          <div className="text-xs text-red-400 font-medium">
                            {stockStatus.statusMessage}
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-white">
                        Rs.{(it.unitPrice * it.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Display subtotal and total amount*/}
            <div className="border-t border-gray-600 pt-4 space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">Subtotal</span>
                <span className="text-sm font-medium text-white">Rs.{subtotal.toFixed(2)}</span>
              </div>

              {discount && computedDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Discount</span>
                  <span className="text-sm font-medium text-red-400">- Rs.{computedDiscount.toFixed(2)}</span>
                </div>
              )}

              {useRedeem && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Points Redeemed</span>
                  <span className="text-sm font-medium text-orange-400">- Rs.{pointsToRedeem.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold text-lg text-white">
                  Rs.{estimatedTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Check for stock issues */}
            {(() => {
              const cartValidation = validateCartStock(cart.items || []);
              
              if (cartValidation.hasStockIssues) {
                return (
                  <div className="customer-error mb-4 p-3 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">
                        ⚠️ Cannot proceed with checkout due to stock issues. Please update your cart.
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="customer-btn-secondary px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !!error || validateCartStock(cart.items || []).hasStockIssues}
                className="customer-btn-primary flex items-center gap-2 px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Processing..." : "Place order"}
              </button>
            </div>
          </>
        ) : (
          <p className="customer-loading">Loading customer...</p>
        )}
      </div>
    </div>

    {/* Payment Modal */}
    <PaymentModal
      isOpen={showPaymentModal}
      onClose={handlePaymentCancel}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentCancel={handlePaymentCancel}
      totalAmount={checkoutSession?.totalAmount || 0}
      customerName={getCustomerDisplayData(customer).name}
    />
    </>
  );
};

export default CheckoutModal;
