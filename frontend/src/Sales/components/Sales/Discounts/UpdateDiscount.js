import { useState, useEffect } from "react";
import ModalWrapper from "../../ModalWrapper";
import "../../../styles/sales.css";
import validateDiscount from "../../../utils/validateDiscount.js";

import { API, API_ENDPOINTS } from "../../../constants/salesApi";

const UpdateDiscount = ({ discount, onClose, onUpdate }) => {
  const [form, setForm] = useState({
    code: discount.code || "",
    title: discount.title || "",
    status: discount.status || "Upcoming",
    startDate: discount.startDate.split("T")[0] || "",
    endDate: discount.endDate.split("T")[0] || "",
    description: discount.description || "",
    discountAmount: discount.discountAmount || 0,
    discountType: discount.discountType || "Percentage",
    validCustomerTiers: discount.validCustomerTiers || [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Auto-update status whenever dates change (inclusive, normalized to local day)
  useEffect(() => {
    if (!form.startDate || !form.endDate) return;

    const now = new Date();
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now < start) setForm((prev) => ({ ...prev, status: "Upcoming" }));
    else if (now > end) setForm((prev) => ({ ...prev, status: "Expired" }));
    else setForm((prev) => ({ ...prev, status: "Active" }));
  }, [form.startDate, form.endDate]);

  // Update form field and live-validate
  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    const newErrors = validateDiscount({ ...form, [field]: value }, { isUpdate: true });
    setErrors(newErrors);
  };

  // Handle tier selection & clear tier error if at least one selected
  const handleTierChange = (tier) => {
    const updatedTiers = form.validCustomerTiers.includes(tier)
      ? form.validCustomerTiers.filter((t) => t !== tier)
      : [...form.validCustomerTiers, tier];

    setForm({ ...form, validCustomerTiers: updatedTiers });

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (updatedTiers.length > 0) delete newErrors.validCustomerTiers;
      return newErrors;
    });
  };

  // Submit update
  const handleSubmit = async () => {
    const validationErrors = validateDiscount(form, { isUpdate: true });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}${API_ENDPOINTS.DISCOUNT_BY_ID(discount._id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), // includes status + code
      });
      if (!res.ok) throw new Error("Failed to update discount");
      const updated = await res.json();
      onUpdate(updated);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper>
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Update Discount</h3>
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
          {/* Code (non-editable) */}
          <div className="flex flex-col">
            <input
              type="text"
              value={form.code}
              disabled
              className="border p-2 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <input
              placeholder="Title"
              className="border p-2 rounded"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
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
            {errors.discountAmount && <p className="text-red-500 text-xs mt-1">{errors.discountAmount}</p>}
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
            {errors.discountType && <p className="text-red-500 text-xs mt-1">{errors.discountType}</p>}
          </div>

          {/* Start Date */}
          <div className="flex flex-col">
            <input
              type="date"
              className="border p-2 rounded"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <input
              type="date"
              className="border p-2 rounded"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
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
          {errors.validCustomerTiers && (
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
            className="btn-secondary"
          >
            {submitting ? "Updating..." : "Update Discount"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default UpdateDiscount;
