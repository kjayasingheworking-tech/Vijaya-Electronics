// Sales Route constants
export const ROUTES = {
  // Customer routes (temporary prefix)
  HOME: '/customer',
  CART: '/customer/cart',
  PRODUCTS: '/customer/products',
  
  // Sales routes
  SALES: '/sales',
  SALES_DASHBOARD: '/sales',
  SALES_CUSTOMERS: '/sales/customers',
  SALES_INVOICES: '/sales/invoices',
  SALES_PAYMENTS: '/sales/payments',
  SALES_DISCOUNTS: '/sales/discounts',
  SALES_REPORTS: '/sales/reports',
  SALES_PAYMENT_HISTORY: (customerId) => `/sales/customers/${customerId}/payment-history`,
  SALES_CREDIT_PAYMENTS: '/sales/payments/credit',
  SALES_CHEQUE_PAYMENTS: '/sales/payments/cheque'
};

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', path: ROUTES.SALES_DASHBOARD, icon: 'Home' },
  { name: 'Invoices', path: ROUTES.SALES_INVOICES, icon: 'FileText' },
  { name: 'Payments', path: ROUTES.SALES_PAYMENTS, icon: 'CreditCard' },
  { name: 'Customers', path: ROUTES.SALES_CUSTOMERS, icon: 'Users' },
  { name: 'Discounts', path: ROUTES.SALES_DISCOUNTS, icon: 'TicketPercent' },
  { name: 'Reports', path: ROUTES.SALES_REPORTS, icon: 'BarChart2' }
];

