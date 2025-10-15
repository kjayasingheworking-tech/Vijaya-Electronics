import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import "../../../styles/sales.css";
import { validateInvoice, validateInvoiceStock, getInvoiceItemsStockStatus } from "../../../utils/validateInvoice.js";
import { validateRedeemPoints } from "../../../utils/validation.js";
import { API, API_ENDPOINTS } from "../../../constants/salesApi";
import ModalWrapper from "../../ModalWrapper"

const CreateInvoice = ({ onClose, onCreate }) => {
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: null,
    customerPoints: null,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerType: null,
    customerBlocked: false,
    customerCreditLimit: 0,
    customerCurrentCreditUsed: 0,
    customerCreditAvailable: 0,
    paymentMethod: "",
    items: [{ productId: null, product: null, name: "", quantity: 1, price: 0 }],
    discountType: "Percentage",
    discountValue: 0,
    discountDescription: "",
    chequeDetails: {
      chequeNumber: "",
      bank: "",
      amount: 0,
      issueDate: ""
    }
  });

  const [customerPoints, setCustomerPoints] = useState(0); // points of registered customer
  const [pointsToRedeem, setPointsToRedeem] = useState(0); // points manager wants to redeem
  const [pointsError, setPointsError] = useState(""); // validation errors

  const [submitting, setSubmitting] = useState(false);

  //state for errors
  const [errors, setErrors] = useState({});

  // Create selectedCustomer object from invoiceForm data
  const selectedCustomer = invoiceForm.customerId ? {
    _id: invoiceForm.customerId,
    name: invoiceForm.customerName,
    email: invoiceForm.customerEmail,
    phone: invoiceForm.customerPhone,
    address: invoiceForm.customerAddress,
    type: invoiceForm.customerType,
    pointsBalance: invoiceForm.customerPoints,
    creditLimit: invoiceForm.customerCreditLimit,
    currentCreditUsed: invoiceForm.customerCurrentCreditUsed,
    creditAvailable: invoiceForm.customerCreditAvailable
  } : null;

  // Get customer details by phone number
  const handleCustomerPhoneBlur = async () => {
    if (!invoiceForm.customerPhone) return;

    try {
      const response = await fetch(`${API}${API_ENDPOINTS.CUSTOMER_BY_PHONE(invoiceForm.customerPhone)}`);
      
      if (response.ok) {
        const customer = await response.json();
        
        if (customer) {
          // Customer found - fill in their details
          setInvoiceForm(prev => ({
            ...prev,
            customerId: customer._id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerAddress: [customer.addressLine1, customer.addressLine2, customer.city].filter(Boolean).join(', '),
            customerType: customer.type,
            customerPoints: customer.pointsBalance,
            customerBlocked: customer.blocked, // Store blocked status
            customerCreditLimit: customer.creditLimit || 0,
            customerCurrentCreditUsed: customer.currentCreditUsed || 0,
            customerCreditAvailable: customer.creditAvailable || 0,
          }));
          setCustomerPoints(customer.pointsBalance || 0);
        } else {
          // No customer found - reset form
          setCustomerPoints(0);
          setInvoiceForm(prev => ({
            ...prev,
            customerId: null,
            customerType: null,
            customerPoints: 0,
            customerBlocked: false,
            customerCreditLimit: 0,
            customerCurrentCreditUsed: 0,
            customerCreditAvailable: 0,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch customer by phone", err);
    }
  };

  // Get customer details by email
  const handleCustomerEmailBlur = async () => {
    if (!invoiceForm.customerEmail) return;

    try {
      const response = await fetch(`${API}${API_ENDPOINTS.CUSTOMER_BY_EMAIL(invoiceForm.customerEmail)}`);
      
      if (response.ok) {
        const customer = await response.json();
        
        if (customer) {
          // Customer found - fill in their details
          setInvoiceForm(prev => ({
            ...prev,
            customerId: customer._id,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerAddress: [customer.addressLine1, customer.addressLine2, customer.city].filter(Boolean).join(', '),
            customerType: customer.type,
            customerPoints: customer.pointsBalance,
            customerBlocked: customer.blocked, // Store blocked status
            customerCreditLimit: customer.creditLimit || 0,
            customerCurrentCreditUsed: customer.currentCreditUsed || 0,
            customerCreditAvailable: customer.creditAvailable || 0,
          }));
          setCustomerPoints(customer.pointsBalance || 0);
        } else {
          // No customer found - reset form
          setCustomerPoints(0);
          setInvoiceForm(prev => ({
            ...prev,
            customerId: null,
            customerType: null,
            customerPoints: 0,
            customerBlocked: false,
            customerCreditLimit: 0,
            customerCurrentCreditUsed: 0,
            customerCreditAvailable: 0,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch customer by email", err);
    }
  };


  //if customerPoints change, ensure pointsToRedeem is not more than that
  useEffect(() => {
    if (pointsToRedeem > customerPoints) {
      setPointsToRedeem(customerPoints);
    }
  }, [customerPoints, pointsToRedeem]);

  //add product state and fetch products
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API}${API_ENDPOINTS.PRODUCTS}`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to fetch products", err));
  }, []);


  const addItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: null, product: null, name: "", quantity: 1, price: 0 }],
    }));
  };

  const removeItem = (index) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateSubtotal = () =>
    invoiceForm.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    let discountAmount = 0;
    
    if (invoiceForm.discountType === "Percentage") {
      discountAmount = (subtotal * (invoiceForm.discountValue || 0)) / 100;
    } else if (invoiceForm.discountType === "Amount") {
      discountAmount = invoiceForm.discountValue || 0;
    }
    
    const pointsDiscount = pointsToRedeem || 0;
    return subtotal - discountAmount - pointsDiscount;
  };

  const handleSubmit = async () => {

    // Validate invoice
    const validationErrors = validateInvoice(invoiceForm);
    setErrors(validationErrors);

    // Check for stock issues
    const stockValidation = validateInvoiceStock(invoiceForm.items);
    if (stockValidation.hasStockIssues) {
      const stockErrors = stockValidation.invalidItems.map(item => 
        `Item "${item.itemName}": ${item.message}`
      ).join('\n');
      
      alert(`Cannot create invoice due to stock issues:\n${stockErrors}`);
      return;
    }

    // Check if any errors exist
    const hasErrors =
      Object.keys(validationErrors).length > 0 ||
      (validationErrors.items && validationErrors.items.length > 0);

    if (hasErrors) return; // stop submission if errors exist

    // Check if customer is blocked
    if (invoiceForm.customerBlocked) {
      alert("Cannot create invoice for blocked customer. Please unblock the customer first.");
      return;
    }

    // Check credit limit for credit payments
    if (invoiceForm.paymentMethod === "Credit" && selectedCustomer?.type === "wholesale") {
      const total = calculateTotal();
      const availableCredit = selectedCustomer.creditAvailable || 0;
      
      if (total > availableCredit) {
        alert(`Cannot process credit payment. Amount (Rs.${total.toFixed(2)}) exceeds available credit (Rs.${availableCredit.toFixed(2)}).`);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(true);

    try {
      const subtotal = calculateSubtotal();
      let discountAmount = 0;
      let discountPercent = 0;
      
      if (invoiceForm.discountType === "Percentage") {
        discountPercent = invoiceForm.discountValue || 0;
        discountAmount = (subtotal * discountPercent) / 100;
      } else if (invoiceForm.discountType === "Amount") {
        discountAmount = invoiceForm.discountValue || 0;
        discountPercent = 0;
      }

      const totalAmount = calculateTotal();

      const payload = {
        customerId: invoiceForm.customerId || null,
        customerPoints: invoiceForm.customerPoints || 0,
        customerSnapshot: {
          name: invoiceForm.customerName,
          email: invoiceForm.customerEmail,
          phone: invoiceForm.customerPhone,
          address: invoiceForm.customerAddress,
        },
        items: invoiceForm.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          unitPrice: i.price,
          quantity: i.quantity,
          total: i.price * i.quantity,
        })),
        discountType: invoiceForm.discountType,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        discountDescription: invoiceForm.discountDescription,
        totalAmount: totalAmount,
        paymentMethod: invoiceForm.paymentMethod,
        paymentDetails: invoiceForm.paymentMethod === "Cheque" ? invoiceForm.chequeDetails : null,
        status:
          invoiceForm.paymentMethod === "Cash" || invoiceForm.paymentMethod === "Card"
            ? "Paid"
            : "Pending",
        pointsRedeemed: invoiceForm.customerId ? pointsToRedeem : 0,
      };

      const res = await fetch(`${API}${API_ENDPOINTS.INVOICES}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });


      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create invoice");
      }

      const invoice = await res.json();
      onCreate(invoice); // add to state in parent
      
      // Update local customer points after redemption
      if (invoice.customerId) {
        setCustomerPoints(prev => prev - (invoice.pointsRedeemed || 0));
        setPointsToRedeem(0); // reset redeemed points input
      }
      onClose();
      alert("Invoice created successfully: " + invoice.invoiceNumber);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <ModalWrapper>
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 space-y-6 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Create Invoice</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Name */}
          <div className="flex flex-col">
            <input
              className="border p-2 rounded"
              placeholder="Customer Name *"
              value={invoiceForm.customerName}
              onChange={(e) => {
                setInvoiceForm(prev => ({ ...prev, customerName: e.target.value }));
                setErrors(prev => ({ ...prev, customerName: "" })); // clear error
              }}
            />
            {errors.customerName && (
              <p className="text-red-500 text-xs">{errors.customerName}</p>
            )}
          </div>

          {/* Customer Email */}
          <div className="flex flex-col">
            <input
              className="border p-2 rounded"
              placeholder="Customer Email"
              type="email"
              value={invoiceForm.customerEmail}
              onChange={(e) => {
                setInvoiceForm((prev) => ({ ...prev, customerEmail: e.target.value }));
                setErrors(prev => ({ ...prev, customerEmail: "" }));
              }}
              onBlur={handleCustomerEmailBlur}
            />
            {errors.customerEmail && (
              <p className="text-red-500 text-xs">{errors.customerEmail}</p>
            )}
          </div>

          {/* Customer Phone */}
          <div className="flex flex-col">
            <input
              className="border p-2 rounded"
              placeholder="Customer Phone"
              value={invoiceForm.customerPhone}
              onChange={(e) => {
                setInvoiceForm((prev) => ({ ...prev, customerPhone: e.target.value }));
                setErrors(prev => ({ ...prev, customerPhone: "" }));
              }}
              onBlur={handleCustomerPhoneBlur}
            />
            {errors.customerPhone && (
              <p className="text-red-500 text-xs">{errors.customerPhone}</p>
            )}
            
            {/* Blocked Customer Warning */}
            {invoiceForm.customerBlocked && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 text-sm">
                  ⚠️ This customer is blocked and cannot place orders.
                </p>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="flex flex-col">
            <select
              className="border p-2 rounded"
              value={invoiceForm.paymentMethod}
              onChange={(e) =>
                setInvoiceForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
              }
            >
              <option value="">Select Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              {selectedCustomer?.type === "wholesale" && (
                <>
                  <option value="Cheque">Cheque (Wholesale Only)</option>
                  <option value="Credit">Credit (Wholesale Only)</option>
                </>
              )}
            </select>
            {errors.paymentMethod && (
              <p className="text-red-500 text-xs">{errors.paymentMethod}</p>
            )}
            {selectedCustomer?.type === "wholesale" && (
              <div className="text-xs text-gray-600 mt-1 space-y-1">
                <div className="flex justify-between items-center">
                  <div>
                    <p>Credit Limit: Rs.{selectedCustomer.creditLimit?.toFixed(2) || "0.00"}</p>
                    <p>Available Credit: Rs.{selectedCustomer.creditAvailable?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cheque Details - Show only when Cheque is selected */}
        {invoiceForm.paymentMethod === "Cheque" && (
          <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-700">Cheque Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Cheque Number *</label>
                <input
                  className="border p-2 rounded"
                  placeholder="Enter cheque number"
                  value={invoiceForm.chequeDetails.chequeNumber}
                  onChange={(e) => {
                    setInvoiceForm((prev) => ({
                      ...prev,
                      chequeDetails: { ...prev.chequeDetails, chequeNumber: e.target.value }
                    }));
                    setErrors(prev => ({ ...prev, chequeNumber: "" }));
                  }}
                />
                {errors.chequeNumber && (
                  <p className="text-red-500 text-xs">{errors.chequeNumber}</p>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Bank *</label>
                <input
                  className="border p-2 rounded"
                  placeholder="Enter bank name"
                  value={invoiceForm.chequeDetails.bank}
                  onChange={(e) => {
                    setInvoiceForm((prev) => ({
                      ...prev,
                      chequeDetails: { ...prev.chequeDetails, bank: e.target.value }
                    }));
                    setErrors(prev => ({ ...prev, bank: "" }));
                  }}
                />
                {errors.bank && (
                  <p className="text-red-500 text-xs">{errors.bank}</p>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Amount (Rs.) *</label>
                <input
                  type="number"
                  className="border p-2 rounded"
                  placeholder="0.00"
                  value={invoiceForm.chequeDetails.amount}
                  onChange={(e) => {
                    setInvoiceForm((prev) => ({
                      ...prev,
                      chequeDetails: { ...prev.chequeDetails, amount: parseFloat(e.target.value) || 0 }
                    }));
                    setErrors(prev => ({ ...prev, chequeAmount: "" }));
                  }}
                  min="0"
                  step="0.01"
                />
                {errors.chequeAmount && (
                  <p className="text-red-500 text-xs">{errors.chequeAmount}</p>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Issue Date *</label>
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={invoiceForm.chequeDetails.issueDate}
                  onChange={(e) => {
                    setInvoiceForm((prev) => ({
                      ...prev,
                      chequeDetails: { ...prev.chequeDetails, issueDate: e.target.value }
                    }));
                    setErrors(prev => ({ ...prev, issueDate: "" }));
                  }}
                />
                {errors.issueDate && (
                  <p className="text-red-500 text-xs">{errors.issueDate}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Address */}
        <div className="flex flex-col mt-2">
          <textarea
            className="border p-2 rounded w-full"
            placeholder="Customer Address"
            rows={2}
            value={invoiceForm.customerAddress}
            onChange={(e) =>
              setInvoiceForm((prev) => ({ ...prev, customerAddress: e.target.value }))
            }
          />
        </div>

        {/* Points Redemption if customer already exists*/}
        {invoiceForm.customerId && customerPoints > 0 && (
          <div className="flex flex-col mt-2">
            <label className="text-sm font-medium">
              Redeem Points (Customer have {customerPoints})
            </label>
            <input
              type="number"
              className="border p-2 rounded w-40"
              value={pointsToRedeem}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setPointsToRedeem(value);
                const errorMsg = validateRedeemPoints(value, customerPoints, calculateSubtotal());
                setPointsError(errorMsg);
              }}
            />
            {pointsError && <p className="text-red-500 text-xs">{pointsError}</p>}
          </div>
        )}

        {/* Items */}
        <div className="space-y-2">
          <h4 className="font-medium">Invoice Items</h4>
          {invoiceForm.items.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="grid grid-cols-5 gap-2 items-center border p-2 rounded">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600">Item *</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={item.productId || ""}
                    onChange={(e) => {
                      const selectedProduct = products.find(p => p._id === e.target.value);
                      if (selectedProduct) {
                        updateItem(index, "name", selectedProduct.productName);
                        updateItem(index, "price", selectedProduct.price);
                        updateItem(index, "productId", selectedProduct._id);
                        updateItem(index, "product", selectedProduct);
                      } else {
                        updateItem(index, "name", "");
                        updateItem(index, "price", 0);
                        updateItem(index, "productId", null);
                        updateItem(index, "product", null);
                      }
                    }}
                  >
                    <option value="">Select Item</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.productName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Quantity</label>
                  <input
                    type="number"
                    className="border p-2 rounded w-full"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                  />
                  {/* Stock Status Display */}
                  {item.product && (
                    <div className="mt-1 text-xs">
                      {(() => {
                        const stockStatus = getInvoiceItemsStockStatus([item])[0]?.stockStatus;
                        if (stockStatus) {
                          return (
                            <span className={`${
                              stockStatus.statusType === 'error' ? 'text-red-600 font-medium' : 'text-gray-500'
                            }`}>
                              {stockStatus.statusMessage}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Price *</label>
                  <input
                    type="number"
                    className="border p-2 rounded w-full no-spinner"
                    value={item.price}
                    readOnly
                  />
                </div>

                {invoiceForm.items.length > 1 && (
                  <button onClick={() => removeItem(index)} className="text-red-500 mt-5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Error message for this item row */}
              {errors.items && errors.items[index] && (
                <p className="text-red-500 text-xs">{errors.items[index]}</p>
              )}
            </div>
          ))}

          <button onClick={addItem} className="flex items-center text-sm text-blue-600 mt-2">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </button>
        </div>

        {/* Discount */}
        <div className="space-y-4">
          <h4 className="font-medium">Discount</h4>
          
          {/* Discount Description */}
          <div className="flex flex-col">
            <input
              className="border p-2 rounded"
              placeholder="Discount Description (Optional)"
              value={invoiceForm.discountDescription}
              onChange={(e) =>
                setInvoiceForm((prev) => ({ ...prev, discountDescription: e.target.value }))
              }
            />
          </div>

          {/* Discount Type and Value */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Discount Type</label>
              <select
                className="border p-2 rounded"
                value={invoiceForm.discountType}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ 
                    ...prev, 
                    discountType: e.target.value,
                    discountValue: 0 // reset value when type changes
                  }))
                }
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Amount">Amount (Rs.)</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">
                Discount {invoiceForm.discountType === "Percentage" ? "(%)" : "(Rs.)"}
              </label>
              <input
                type="number"
                className="border p-2 rounded w-24"
                value={invoiceForm.discountValue}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))
                }
                min="0"
                step={invoiceForm.discountType === "Percentage" ? "0.01" : "0.01"}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white py-6 rounded max-w-md ml-auto">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal ({invoiceForm.items.length} items)</span>
              <span>Rs.{calculateSubtotal().toFixed(2)}</span>
            </div>
            {invoiceForm.discountValue > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>
                  Discount {invoiceForm.discountType === "Percentage" 
                    ? `(${invoiceForm.discountValue}%)` 
                    : `(Rs.${invoiceForm.discountValue})`}
                </span>
                <span className="text-red-500">
                  - Rs.{(invoiceForm.discountType === "Percentage" 
                    ? (calculateSubtotal() * (invoiceForm.discountValue || 0) / 100)
                    : (invoiceForm.discountValue || 0)).toFixed(2)}
                </span>
              </div>
            )}
            {pointsToRedeem > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Points Redeemed</span>
                <span className="text-honeycomb-orange">- Rs.{pointsToRedeem.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-bold text-gray-800 text-lg">
                <span>Total</span>
                <span>Rs.{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="btn-group-end">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !!pointsError}
            className="btn-primary"
          >
            {submitting ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CreateInvoice;
