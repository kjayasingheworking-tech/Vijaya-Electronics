export const validateDiscount = (form, { isUpdate = false } = {}) => {
  const errors = {};

  if (!form.title || form.title.trim() === "") {
    errors.title = "*Title is required";
  }

  if (!isUpdate) {
    if (!form.code || form.code.trim() === "") {
      errors.code = "*Discount code is required";
    }

    if (!form.discountAmount || form.discountAmount <= 0) {
      errors.discountAmount = "Discount amount must be greater than 0";
    }

    if (!form.discountType || (form.discountType !== "Percentage" && form.discountType !== "Amount")) {
      errors.discountType = "*Discount type is required";
    }
  }

  if (!form.startDate) errors.startDate = "*Start date is required";
  if (!form.endDate) errors.endDate = "*End date is required";
  if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
    errors.endDate = "*End date must be after start date";
  }

  if (!form.validCustomerTiers || form.validCustomerTiers.length === 0) {
    errors.validCustomerTiers = "*Select at least one customer tier";
  }

  return errors;
};
export default validateDiscount;
