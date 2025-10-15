import { useState } from "react";
import ModalWrapper from "../../ModalWrapper";
import "../../../styles/sales.css";
import { validateCustomer, sanitizeCustomerForm } from "../../../utils/validateCustomer.js";
import { API, API_ENDPOINTS } from "../../../constants/salesApi";

const CreateWholesaleCustomer = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    companyName: "",
    type: "wholesale",
    tier: "silver",
    creditLimit: 0,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = validateCustomer(form);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Sanitize form data before sending
      const sanitizedForm = sanitizeCustomerForm(form);
      
      const res = await fetch(`${API}${API_ENDPOINTS.CUSTOMER_ADD}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: Failed to create customer`);
      }

      const customer = await res.json();
      onCreate(customer);
      onClose();
      alert("Wholesale customer created successfully");
    } catch (err) {
      console.error("Customer creation error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper>
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Create Wholesale Customer</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

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
              type="tel"
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Company Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company name (optional)"
              value={form.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
            />
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

        </div>

        {/* Actions */}
        <div className="btn-group-end pt-4 border-t">
          <button
            onClick={onClose}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CreateWholesaleCustomer;
