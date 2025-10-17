import { useState, useEffect } from "react";
import { Users, FileText, CreditCard, DollarSign, Calendar, } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "../../styles/sales.css";
import CreateInvoice from "../../components/Sales/Invoices/CreateInvoice";
import CreateWholesaleCustomer from "../../components/Sales/Customers/CreateWholesaleCustomer";
import { API, API_ENDPOINTS } from "../../constants/salesApi";
import { getCustomerDisplayData } from "../../utils/customerDataUtils";

const Dashboard = () => {
  const { user } = useAuth(); // Get logged-in user
  const salesManagerId = user?._id; // Use user's ID

  const [dashboardData, setDashboardData] = useState({
    customers: [],
    invoices: [],
    products: [],
    loading: true
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showCreateCus, setShowCreateCus] = useState(false);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    activeDiscounts: 0
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [customersRes, invoicesRes, productsRes] = await Promise.all([
          fetch(`${API}${API_ENDPOINTS.CUSTOMERS}`),
          fetch(`${API}${API_ENDPOINTS.INVOICES}`),
          fetch(`${API}${API_ENDPOINTS.PRODUCTS}`)
        ]);

        const [customers, invoices, products] = await Promise.all([
          customersRes.json(),
          invoicesRes.json(),
          productsRes.json()
        ]);

        setDashboardData({ customers, invoices, products, loading: false });

        // Calculate stats
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyInvoices = invoices.filter(inv =>
          new Date(inv.createdAt) >= thisMonth
        );

        const monthlyRevenue = monthlyInvoices.reduce((sum, inv) =>
          sum + (inv.totalAmount || 0), 0
        );

        const pendingPayments = invoices.filter(inv =>
          inv.status === 'Pending'
        ).length;

        setStats({
          totalCustomers: customers.length,
          totalInvoices: invoices.length,
          totalProducts: products.length,
          monthlyRevenue,
          pendingPayments,
          activeDiscounts: 0 // Will be calculated when discount data is available
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-LK').format(num);
  };

  const statCards = [
    {
      title: "Total Customers",
      value: formatNumber(stats.totalCustomers),
      icon: Users,
      color: "bg-electric-blue",
      bgGradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      color: "bg-green-500",
      bgGradient: "from-green-500 to-green-600",
    },
    {
      title: "Total Invoices",
      value: formatNumber(stats.totalInvoices),
      icon: FileText,
      color: "bg-honeycomb-orange",
      bgGradient: "from-orange-500 to-orange-600",
    },
    {
      title: "Pending Payments",
      value: formatNumber(stats.pendingPayments),
      icon: CreditCard,
      color: "bg-red-500",
      bgGradient: "from-red-500 to-red-600",
    }
  ];

  const recentInvoices = dashboardData.invoices
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const topCustomers = dashboardData.customers
    .sort((a, b) => (b.pointsBalance || 0) - (a.pointsBalance || 0))
    .slice(0, 5);

  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening at Wijaya Electronics.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('en-LK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ title, value, icon: Icon, bgGradient }, index) => (
          <div
            key={title}
            className="bg-white rounded-2xl shadow-elegant p-6 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${bgGradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-600 mt-1">{title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Tables Row */}
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl shadow-elegant p-6 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
          </div>
          <div className="space-y-4">
            {recentInvoices.map((invoice) => (
              <div key={invoice._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-electric-blue/10 rounded-lg">
                    <FileText className="h-4 w-4 text-electric-blue" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">{invoice.customerSnapshot?.name || 'Walk-in Customer'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                  <p className={`text-xs px-2 py-1 rounded-full ${invoice.status === 'Paid'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {invoice.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl shadow-elegant p-6 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
          </div>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={customer._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-honeycomb-orange/10 rounded-lg">
                    <Users className="h-4 w-4 text-honeycomb-orange" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{getCustomerDisplayData(customer).name}</p>
                    <p className="text-sm text-gray-600">{customer.tier} Tier</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatNumber(customer.pointsBalance || 0)} pts</p>
                  <p className="text-xs text-gray-500">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-electric-blue to-electric-blue-dark rounded-2xl shadow-elegant p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Quick Actions</h3>
            <p className="text-blue-100">Manage your business operations efficiently</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowCreate(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>New Invoice</span>
            </button>
            <button
              onClick={() => setShowCreateCus(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateInvoice
          onClose={() => setShowCreate(false)}
        />
      )}
      {showCreateCus && (
        <CreateWholesaleCustomer
          onClose={() => setShowCreateCus(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
