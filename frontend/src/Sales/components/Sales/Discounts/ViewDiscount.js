import ModalWrapper from "../../ModalWrapper";
import "../../../styles/sales.css";

const ViewDiscount = ({ discount, onClose }) => {
  if (!discount) return null;

  // Format date
  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Prepare label-value pairs
  const pairs = [
    { label: "Code", value: discount.code },
    { label: "Status", value: discount.status, isStatus: true },
    {
      label: "Discount Amount",
      value:
        discount.discountType === "Percentage"
          ? `${discount.discountAmount}%`
          : `Rs.${discount.discountAmount}`,
    },
    {
      label: "Customer Tiers",
      value: discount.validCustomerTiers,
      isTiers: true,
    },
    { label: "Start Date", value: formatDate(discount.startDate) },
    { label: "End Date", value: formatDate(discount.endDate) },
  ];

  return (
    <ModalWrapper>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-card p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-2xl text-electric-blue font-bold">{discount.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Label-Value Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pairs.map((pair, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded">
              <span className="text-slate-gray font-medium">{pair.label} :</span>
              {pair.isStatus ? (
                <span
                  className={
                    pair.value === "Active"
                      ? "status-active"
                      : pair.value === "Upcoming"
                      ? "status-pending"
                      : "status-expired"
                  }
                >
                  {pair.value}
                </span>
              ) : pair.isTiers ? (
                <div className="text-dark-charcoal flex flex-col items-end">
                  {pair.value.length > 0 ? pair.value.map((tier, i) => <span key={i}>{tier}</span>) : "-"}
                </div>
              ) : (
                <span className="text-dark-charcoal">{pair.value || "-"}</span>
              )}
            </div>
          ))}
        </div>

        {/* Description */}
        {discount.description && discount.description.trim() !== "" && (
          <div className="bg-gray-50 px-4 py-3 rounded">
            <span className="text-slate-gray font-medium">Description :</span>
            <span className="text-dark-charcoal ml-2">{discount.description}</span>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
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

export default ViewDiscount;
