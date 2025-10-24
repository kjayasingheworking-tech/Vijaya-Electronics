import { useState } from "react";
import { CreditCard, X, CheckCircle, AlertCircle } from "lucide-react";
import {
  validatePaymentForm,
  formatCardNumber,
  formatExpiryDate,
  formatCVV,
  getCardType
} from "../../utils/paymentValidation";
import "../../styles/customer-dark.css";

const PaymentModal = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  onPaymentCancel,
  totalAmount,
  customerName
}) => {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: ""
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [step, setStep] = useState("details"); // "details", "processing", "success", "error"

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === "cardNumber") {
      const formatted = formatCardNumber(value);
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "expiryDate") {
      const formatted = formatExpiryDate(value);
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "cvv") {
      const formatted = formatCVV(value);
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateCardDetails = () => {
    const validation = validatePaymentForm(cardDetails);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      // Get the first error message for general error display
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      return false;
    }
    // Clear all errors if validation passes
    setFieldErrors({});
    setError("");
    return true;
  };

  const handlePayment = async () => {
    if (!validateCardDetails()) return;

    setError("");
    setIsProcessing(true);
    setStep("processing");

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate payment success
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (success) {
        setStep("success");
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
      } else {
        setStep("error");
        setError("Payment failed. Please try again or use a different card.");
      }
    } catch (err) {
      setStep("error");
      setError("Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setCardDetails({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: ""
    });
    setError("");
    setStep("details");
    onPaymentCancel();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="customer-modal w-full max-w-md rounded-lg shadow-xl">
        {/* Header */}
        <div className="modal-header flex justify-between items-center p-5 border-b">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-electric-blue" />
            <h3 className="modal-title text-xl font-bold">Payment</h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={isProcessing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="pb-3 px-6">
          {step === "details" && (
            <>
              <div className="mb-4 pt-3">
                <p className="text-sm text-white/80">
                  Paying for: <span className="font-semibold">{customerName}</span>
                </p>
                <p className="text-2xl font-bold text-white/90">
                  Rs. {totalAmount.toFixed(2)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full p-3 border rounded ${fieldErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {fieldErrors.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.cardNumber}</p>
                  )}
                  {cardDetails.cardNumber && !fieldErrors.cardNumber && getCardType(cardDetails.cardNumber) && (
                    <p className="text-green-600 text-xs mt-1">
                      {getCardType(cardDetails.cardNumber)} detected
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      className={`w-full p-3 border rounded ${fieldErrors.expiryDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.expiryDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      className={`w-full p-3 border rounded ${fieldErrors.cvv ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.cvv && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.cvv}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={cardDetails.cardholderName}
                    onChange={handleInputChange}
                    placeholder="Card Holder Name"
                    className={`w-full p-3 border rounded ${fieldErrors.cardholderName ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {fieldErrors.cardholderName && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.cardholderName}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6 pb-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border customer-btn-secondary rounded-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 px-4 py-3 bg-electric-blue text-white rounded-sm hover:bg-electric-blue-dark transition-colors"
                >
                  Pay Rs. {totalAmount.toFixed(2)}
                </button>
              </div>
            </>
          )}

          {step === "processing" && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we process your payment...</p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600">Your order has been confirmed successfully.</p>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border customer-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setStep("details");
                    setError("");
                  }}
                  className="flex-1 px-4 py-3 bg-electric-blue text-white rounded hover:bg-electric-blue-dark transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
