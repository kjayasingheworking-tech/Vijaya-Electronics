import { useState, useEffect } from "react";
import ModalWrapper from "../../ModalWrapper";
import validateDiscount from "../../../utils/validateDiscount.js";
import "../../../styles/sales.css";

import { API, API_ENDPOINTS } from "../../../constants/salesApi";

const CreateDiscount = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    discountAmount: 0,
    discountType: "Percentage",
    startDate: "",
    endDate: "",
    validCustomerTiers: [],
    status: "Upcoming",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Live status update based on dates (inclusive, normalized to local day)
  useEffect(() => {
    if (!form.startDate || !form.endDate) return;

    const now = new Date();
    // Ensure dates are parsed correctly (YYYY-MM-DD format from input)
    const start = new Date(form.startDate + 'T00:00:00');
    const end = new Date(form.endDate + 'T23:59:59');

    let newStatus;
    if (now < start) newStatus = "Upcoming";
    else if (now > end) newStatus = "Expired";
    else newStatus = "Active"; // inclusive window

    // Only update if status actually changed
    setForm(prev => {
      if (prev.status !== newStatus) {
        return { ...prev, status: newStatus };
      }
      return prev;
    });
  }, [form.startDate, form.endDate]);

  // Update field and validate only that field
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    const fieldErrors = validateDiscount({ ...form, [field]: value }, { isUpdate: false });
    setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const handleTierChange = (tier) => {
    const updatedTiers = form.validCustomerTiers.includes(tier)
      ? form.validCustomerTiers.filter(t => t !== tier)
      : [...form.validCustomerTiers, tier];

    setForm(prev => ({ ...prev, validCustomerTiers: updatedTiers }));
    setTouched(prev => ({ ...prev, validCustomerTiers: true }));

    const fieldErrors = validateDiscount(
      { ...form, validCustomerTiers: updatedTiers },
      { isUpdate: false }
    );
    setErrors(prev => ({ ...prev, validCustomerTiers: fieldErrors.validCustomerTiers }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateDiscount(form, { isUpdate: false });
    setErrors(validationErrors);

    // mark everything touched on submit
    setTouched({
      code: true,
      title: true,
      description: true,
      discountAmount: true,
      discountType: true,
      startDate: true,
      endDate: true,
      validCustomerTiers: true,
    });

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}${API_ENDPOINTS.DISCOUNTS}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: Failed to create discount`);
      }
      
      const discount = await res.json();
      onCreate(discount);
      onClose();
      alert("Discount created successfully");
    } catch (err) {
      console.error("Discount creation error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper>
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Create Discount</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Status Display */}
        <p className="text-sm font-medium mb-2">
          Status: <span className={`px-2 py-1 rounded text-xs font-medium 
            ${form.status === "Active" ? "status-active"
              : form.status === "Upcoming" ? "status-pending"
                : "status-expired"}`}>
            {form.status}
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Code */}
          <div className="flex flex-col">
            <input
              placeholder="Code"
              className="border p-2 rounded"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />
            {touched.code && errors.code && (
              <p className="text-red-500 text-xs mt-1">{errors.code}</p>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <input
              placeholder="Title"
              className="border p-2 rounded"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
            {touched.title && errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Discount Amount */}
          <div className="flex flex-col">
            <input
              type="number"
              placeholder="Discount Amount"
              className="border p-2 rounded"
              value={form.discountAmount}
              onChange={(e) => handleChange("discountAmount", parseFloat(e.target.value) || 0)}
            />
            {touched.discountAmount && errors.discountAmount && (
              <p className="text-red-500 text-xs mt-1">{errors.discountAmount}</p>
            )}
          </div>

          {/* Discount Type */}
          <div className="flex flex-col">
            <select
              className="border p-2 rounded"
              value={form.discountType}
              onChange={(e) => handleChange("discountType", e.target.value)}
            >
              <option value="Percentage">Percentage</option>
              <option value="Amount">Amount</option>
            </select>
            {touched.discountType && errors.discountType && (
              <p className="text-red-500 text-xs mt-1">{errors.discountType}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="flex flex-col">
            <input
              type="date"
              className="border p-2 rounded"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
            {touched.startDate && errors.startDate && (
              <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <input
              type="date"
              className="border p-2 rounded"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
            {touched.endDate && errors.endDate && (
              <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Customer Tiers */}
        <div>
          <div className="flex gap-2">
            {["Silver", "Gold", "Diamond"].map(tier => (
              <label key={tier} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.validCustomerTiers.includes(tier)}
                  onChange={() => handleTierChange(tier)}
                />
                {tier}
              </label>
            ))}
          </div>
          {touched.validCustomerTiers && errors.validCustomerTiers && (
            <p className="text-red-500 text-xs mt-1">{errors.validCustomerTiers}</p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col">
          <textarea
            placeholder="Description"
            className="border p-2 rounded w-full"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="btn-group-end">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? "Creating..." : "Create Discount"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CreateDiscount;
