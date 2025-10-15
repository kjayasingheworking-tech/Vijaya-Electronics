import { useState, useEffect } from "react";
import { Plus, Eye, Trash2, Edit2 } from "lucide-react";
import "../../styles/sales.css";
import CreateDiscount from "../../components/Sales/Discounts/CreateDiscount";
import ViewDiscount from "../../components/Sales/Discounts/ViewDiscount";
import UpdateDiscount from "../../components/Sales/Discounts/UpdateDiscount";
import { API, API_ENDPOINTS } from "../../constants/salesApi";

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [discountToUpdate, setDiscountToUpdate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const res = await fetch(`${API}${API_ENDPOINTS.DISCOUNTS}`);
        const data = await res.json();

        // Backend already handles status updates automatically
        setDiscounts(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscounts();
  }, []);

  // Update discount in parent list after successful update
  const handleUpdate = (updatedDiscount) => {
    setDiscounts((prev) =>
      prev.map((d) => (d._id === updatedDiscount._id ? updatedDiscount : d))
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) return;
    try {
      const res = await fetch(`${API}${API_ENDPOINTS.DISCOUNT_BY_ID(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete discount");
      setDiscounts(prev => prev.filter(d => d._id !== id));
      alert("Discount deleted successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter discounts based on search term, status, and type
  const filteredDiscounts = discounts.filter(discount => {
    // Check if discount matches search term
    const titleMatch = discount.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const codeMatch = discount.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = titleMatch || codeMatch;
    
    // Check if discount matches status filter
    const statusMatch = filterStatus === "all" || discount.status === filterStatus;
    
    // Check if discount matches type filter
    const typeMatch = filterType === "all" || discount.discountType === filterType;
    
    // Discount is shown if it matches all filters
    return searchMatch && statusMatch && typeMatch;
  });

  return (
    <div className="p-2 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Discounts</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-create"
        >
          <Plus className="h-5 w-5" /> Create Discount
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title or discount code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
        </div>
        
        {/* Status Filter */}
        <div className="lg:w-40">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="lg:w-40">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue"
          >
            <option value="all">All Types</option>
            <option value="Percentage">Percentage</option>
            <option value="Amount">Amount</option>
          </select>
        </div>
      </div>

      {/* Discount Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredDiscounts.length} of {discounts.length} discounts
      </div>

      {loading ? (
        <p>Loading discounts...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiscounts.length > 0 ? (
            filteredDiscounts.map(discount => (
              <div key={discount._id} className="bg-white shadow rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold">{discount.title}</h3>
                  <span className=
                    {`${discount.status === "Active" ? "status-active"
                      : discount.status === "Upcoming" ? "status-pending"
                        : "status-expired"}`}>
                    {discount.status}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-2">{discount.code}</p>
                <p className="text-gray-900 font-bold mb-3">
                  {discount.discountType === "Percentage" ? `${discount.discountAmount}%` : `Rs.${discount.discountAmount}`}
                </p>

                <div className="flex justify-end gap-2 mt-auto">
                  {/* View button */}
                  <button
                    onClick={() => setSelectedDiscount(discount)}
                    className="p-2 border rounded hover:bg-gray-50">
                    <Eye className="h-4 w-4" />
                  </button>
                  {/* Update button */}
                  <button
                    onClick={() => {
                      setDiscountToUpdate(discount);
                      setShowUpdate(true);
                    }}
                    className="p-2 border rounded hover:bg-blue-100">
                    <Edit2 className="h-4 w-4 text-blue-500" />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(discount._id)}
                    className="p-2 border rounded hover:bg-red-100">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-full">
              {discounts.length === 0 ? "No discounts found" : "No discounts match your search criteria"}
            </p>
          )}
        </div>
      )}

      {showCreate && <CreateDiscount
        onClose={() => setShowCreate(false)}
        onCreate={(d) => setDiscounts(prev => [...prev, d])} />}

      {selectedDiscount && <ViewDiscount
        discount={selectedDiscount}
        onClose={() => setSelectedDiscount(null)} />}

      {showUpdate && discountToUpdate && <UpdateDiscount
        discount={discountToUpdate}
        onClose={() => setShowUpdate(false)}
        onUpdate={handleUpdate}
      />}
    </div>
  );
};

export default Discounts;
