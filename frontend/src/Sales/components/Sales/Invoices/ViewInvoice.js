import ModalWrapper from "../../ModalWrapper"
import "../../../styles/sales.css"

const ViewInvoice = ({ invoice, onClose }) => {
  if (!invoice) return null;

  // Use DB values
  const items = invoice.items.map(i => ({
    name: i.name,
    quantity: i.quantity,
    price: i.unitPrice,
    total: i.total,
  }));

  // Calculate discount amount - use stored discountAmount if available, otherwise calculate from percentage
  const discountAmount = invoice.discountAmount || (invoice.subtotal * (invoice.discountPercent || 0) / 100);

  //Date and Time formatting
  const formatDate = (date) => new Date(date).toLocaleDateString(
    undefined, {
    day: "2-digit", month: "short", year: "numeric"
  });

  const formatTime = (date) => new Date(date).toLocaleTimeString(
    undefined, { hour: "2-digit", minute: "2-digit" }
  );

  return (
    <ModalWrapper>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6 space-y-4 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-3">
          <div className="font-bold">
            <h3 className="text-3xl text-electric-blue">INVOICE</h3>
            <h3 className="text-lg text-gray-500 font-semibold">Wijaya Electronics</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
        </div>

        {/* Invoice Number and Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-3">
          <div>
            <p className="font-semibold text-gray-700">Invoice Number: {invoice.invoiceNumber || invoice._id}</p>
            <p className="font-semibold text-gray-700">{invoice.customerSnapshot?.name}</p>
            <p className="text-gray-500 text-sm">{invoice.customerSnapshot?.email}</p>
            {invoice.customerSnapshot?.phone && <p className="text-gray-500 text-sm">{invoice.customerSnapshot.phone}</p>}
            {invoice.customerSnapshot?.address && <p className="text-gray-500 text-sm">{invoice.customerSnapshot.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">Invoice Date: {formatDate(invoice.createdAt)}</p>
            <p className="text-gray-500 text-sm">Time: {formatTime(invoice.createdAt)}</p>
            <p className="text-gray-500 text-sm">Payment: {invoice.paymentMethod}</p>
            {invoice.paymentMethod === "Cheque" && invoice.paymentDetails && (
              <div className="text-xs text-gray-500 mt-1">
                <p>Cheque #: {invoice.paymentDetails.chequeNumber}</p>
                <p>Bank: {invoice.paymentDetails.bank}</p>
                <p>Amount: Rs.{invoice.paymentDetails.amount}</p>
                <p>Date: {formatDate(invoice.paymentDetails.issueDate)}</p>
              </div>
            )}
            <p className={`font-semibold ${invoice.status === "Paid" ? "text-green-600" : "text-red-500"}`}>
              Status: {invoice.status}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <h3 className="font-bold text-lg text-gray-800 mb-4">Order Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left border">Item</th>
                <th className="p-3 text-right border">Qty</th>
                <th className="p-3 text-right border">Unit Price (Rs.)</th>
                <th className="p-3 text-right border">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 border">{item.name}</td>
                  <td className="p-3 text-right border">{item.quantity}</td>
                  <td className="p-3 text-right border">{item.price}</td>
                  <td className="p-3 text-right border">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="bg-white py-6 rounded max-w-md ml-auto">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal ({invoice.items.length} items)</span>
              <span>Rs.{invoice.subtotal.toFixed(2)}</span>
            </div>
            {(invoice.discountPercent > 0 || invoice.discountAmount > 0) && (
              <div className="flex justify-between text-gray-500">
                <span>
                  Discount {invoice.discountType === "Percentage" 
                    ? `(${invoice.discountPercent}%)` 
                    : `(Rs.${invoice.discountAmount})`}
                  {invoice.discountDescription && (
                    <div className="text-xs text-gray-400">{invoice.discountDescription}</div>
                  )}
                </span>
                <span className="text-red-500">- Rs.{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {invoice.pointsRedeemed > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Points Redeemed</span>
                <span className=" text-honeycomb-orange">- Rs.{invoice.pointsRedeemed.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-bold text-gray-800 text-lg">
                <span>Total</span>
                <span>Rs.{invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            {invoice.pointsAwarded > 0 && (
              <p className="text-sm text-gray-500 mt-2 text-right">Loyalty Points Awarded: {invoice.pointsAwarded}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4">
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

export default ViewInvoice;
