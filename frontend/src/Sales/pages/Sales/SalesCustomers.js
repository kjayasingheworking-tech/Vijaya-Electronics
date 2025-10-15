import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Users, Edit2, History, UserCheck, UserX } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "../../styles/sales.css";
import CreateWholesaleCustomer from "../../components/Sales/Customers/CreateWholesaleCustomer";
import ViewCustomer from "../../components/Sales/Customers/ViewCustomer";
import UpdateWholesaleCustomer from "../../components/Sales/Customers/UpdateWholesaleCustomer";
import { API, API_ENDPOINTS } from "../../constants/salesApi";
import { ROUTES } from "../../constants/salesRoutes";

const SalesCustomers = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get main app user data for fallback
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, regular, wholesale

  // Helper function to merge customer data with user data for fallback
  const getCustomerDisplayData = (customer) => {
    return {
      ...customer,
      name: customer.name || user?.name ,
      email: customer.email || user?.email ,
      phone: customer.phone || user?.phone ,
      // Keep original customer data but provide fallbacks for missing fields
    };
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}${API_ENDPOINTS.CUSTOMERS}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        console.error("Failed to fetch customers");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = (newCustomer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setShowCreateModal(false);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleUpdateCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowUpdateModal(true);
  };

  const handleViewPaymentHistory = (customer) => {
    navigate(ROUTES.SALES_PAYMENT_HISTORY(customer._id));
  };

  const handleCustomerUpdate = (updatedCustomer) => {
    // Update the customer in the list
    setCustomers(prev => 
      prev.map(customer => 
        customer._id === updatedCustomer._id ? updatedCustomer : customer
      )
    );
  };

  const handleQuickBlockToggle = async (customer) => {
    // Determine new status and action
    const newBlockedStatus = !customer.blocked;
    const action = newBlockedStatus ? "block" : "unblock";
    
    // Ask for confirmation
    const confirmMessage = `Are you sure you want to ${action} ${customer.name}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Send request to server
      const response = await fetch(`${API}${API_ENDPOINTS.CUSTOMER_BY_ID(customer._id)}/block-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: newBlockedStatus }),
      });

      // Check if request was successful
      if (!response.ok) {
        throw new Error(`Failed to ${action} customer`);
      }

      // Get result and update customer list
      const result = await response.json();
      handleCustomerUpdate(result.customer);
      alert(result.message);
      
    } catch (err) {
      console.error(`Error ${action}ing customer:`, err);
      alert(`Error: ${err.message}`);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    // Get display data with fallbacks for search
    const displayData = getCustomerDisplayData(customer);
    
    // Check if customer matches search term (using fallback data)
    const nameMatch = displayData.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = displayData.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = displayData.phone?.includes(searchTerm);
    const matchesSearch = nameMatch || emailMatch || phoneMatch;
    
    // Check if customer matches filter type
    const matchesFilter = filterType === "all" || customer.type === filterType;
    
    // Customer is shown if it matches both search and filter
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (blocked) => {
    return blocked ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Blocked
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  const getTierBadge = (tier) => {
    const colors = {
      silver: "bg-gray-100 text-gray-800",
      gold: "bg-yellow-100 text-yellow-800",
      diamond: "bg-blue-100 text-blue-800"
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[tier] || colors.silver}`}>
        {tier?.charAt(0).toUpperCase() + tier?.slice(1) || "Silver"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-create"
        >
          <Plus className="h-4 w-4" />
          Create Wholesale Customer
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Customers</option>
            <option value="regular">Regular Customers</option>
            <option value="wholesale">Wholesale Customers</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Regular Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.type === "regular").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Wholesale Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.type === "wholesale").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Blocked Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.blocked).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const displayData = getCustomerDisplayData(customer);
                return (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{displayData.name}</div>
                        <div className="text-sm text-gray-500">{displayData.email}</div>
                        <div className="text-sm text-gray-500">{displayData.phone}</div>
                        {customer.companyName && (
                          <div className="text-sm text-gray-500">{customer.companyName}</div>
                        )}
                      </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {customer.type?.charAt(0).toUpperCase() + customer.type?.slice(1) || "Regular"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTierBadge(customer.tier)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.pointsBalance || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(customer.blocked)}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="p-2 border rounded hover:bg-gray-50"
                          title="View Customer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewPaymentHistory(customer)}
                          className="p-2 border rounded hover:bg-gray-50"
                          title="Payment History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        {customer.type === "wholesale" && (
                          <button
                            onClick={() => handleUpdateCustomer(customer)}
                            className="p-2 border rounded hover:bg-gray-50"
                            title="Edit Customer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleQuickBlockToggle(customer)}
                          className={`flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50 ${
                            customer.blocked ? "hover:bg-green-50" : "hover:bg-red-50"
                          }`}
                          title={customer.blocked ? "Unblock Customer" : "Block Customer"}
                        >
                          {customer.blocked ? (
                            <>
                              <UserCheck className="h-4 w-4 text-electric-blue" />
                              <span className="text-xs text-electric-blue">Unblock</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 text-red-500" />
                              <span className="text-xs text-red-500">Block</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first wholesale customer."
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateWholesaleCustomer
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCustomer}
        />
      )}

      {showViewModal && selectedCustomer && (
        <ViewCustomer
          customer={selectedCustomer}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCustomer(null);
          }}
          onCustomerUpdate={handleCustomerUpdate}
          onEdit={handleUpdateCustomer}
        />
      )}

      {showUpdateModal && selectedCustomer && (
        <UpdateWholesaleCustomer
          customer={selectedCustomer}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedCustomer(null);
          }}
          onUpdate={handleCustomerUpdate}
        />
      )}

    </div>
  );
};

export default SalesCustomers;
