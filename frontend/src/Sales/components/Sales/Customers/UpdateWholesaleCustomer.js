import { useState, useEffect } from "react";
import ModalWrapper from "../../ModalWrapper";
import "../../../styles/sales.css";
import { validateCustomer, sanitizeCustomerForm } from "../../../utils/validateCustomer.js";
import { API, API_ENDPOINTS } from "../../../constants/salesApi";

const UpdateWholesaleCustomer = ({ customer, onClose, onUpdate }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    companyName: "",
    type: "wholesale",
    tier: "silver",
    creditLimit: 0,
    pointsBalance: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
    totalPurchaseAmount: 0
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with customer data
  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        addressLine1: customer.addressLine1 || "",
        addressLine2: customer.addressLine2 || "",
        city: customer.city || "",
        companyName: customer.companyName || "",
        type: customer.type || "wholesale",
        tier: customer.tier || "silver",
        creditLimit: customer.creditLimit || 0,
        pointsBalance: customer.pointsBalance || 0,
        totalPointsEarned: customer.totalPointsEarned || 0,
        totalPointsRedeemed: customer.totalPointsRedeemed || 0,
        totalPurchaseAmount: customer.totalPurchaseAmount || 0
      });
    }
  }, [customer]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateCustomer(form);
    setErrors(validationErrors);
    
    // Check if any errors exist
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (hasErrors) return;
    
    setSubmitting(true);
    
    try {
      // Sanitize form data
      const sanitizedData = sanitizeCustomerForm(form);
      
      // Send update request
      const response = await fetch(`${API}${API_ENDPOINTS.CUSTOMER_BY_ID(customer._id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update customer");
      }
      
      const updatedCustomer = await response.json();
      onUpdate(updatedCustomer);
      onClose();
      alert("Customer updated successfully");
      
    } catch (err) {
      console.error("Customer update error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper>
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Update Wholesale Customer</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter customer name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Address Line 1 */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
              <input
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address line 1"
                value={form.addressLine1}
                onChange={(e) => handleChange("addressLine1", e.target.value)}
              />
              {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
            </div>

            {/* Address Line 2 */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address line 2 (optional)"
                value={form.addressLine2}
                onChange={(e) => handleChange("addressLine2", e.target.value)}
              />
              {errors.addressLine2 && <p className="text-red-500 text-xs mt-1">{errors.addressLine2}</p>}
            </div>

            {/* City */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Company Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
                value={form.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
              />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
            </div>

            {/* Tier */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Tier *</label>
              <select
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.tier}
                disabled="true"
                onChange={(e) => handleChange("tier", e.target.value)}
              >
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="diamond">Diamond</option>
              </select>
              {errors.tier && <p className="text-red-500 text-xs mt-1">{errors.tier}</p>}
            </div>

            {/* Credit Limit */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Credit Limit (Rs.)</label>
              <input
                type="number"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled="true"
                placeholder="0.00"
                value={form.creditLimit}
                onChange={(e) => handleChange("creditLimit", parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
              {errors.creditLimit && <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>}
            </div>

            {/* Points Balance */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Points Balance</label>
              <input
                type="number"
                disabled="true"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                value={form.pointsBalance}
                onChange={(e) => handleChange("pointsBalance", parseInt(e.target.value) || 0)}
                min="0"
              />
              {errors.pointsBalance && <p className="text-red-500 text-xs mt-1">{errors.pointsBalance}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="btn-group-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-secondary"
            >
              {submitting ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

export default UpdateWholesaleCustomer;
