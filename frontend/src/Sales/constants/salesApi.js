// Sales API constants
export const API = process.env.REACT_APP_API || 'http://localhost:5000/api/sales';

export const API_ENDPOINTS = {
  // Customer endpoints
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id) => `/customers/${id}`,
  CUSTOMER_BY_PHONE: (phone) => `/customers/phone/${phone}`,
  CUSTOMER_BY_EMAIL: (email) => `/customers/email/${email}`,
  CUSTOMER_ADD: '/customers/add',
  CUSTOMER_UPDATE_CREDIT: (id) => `/customers/${id}/update-credit`,
  CUSTOMER_BLOCK_STATUS: (id) => `/customers/${id}/block-status`,
  
  // Product endpoints
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  CATEGORIES: '/products/categories',
  
  // Cart endpoints
  CART: '/cart',
  CART_BY_CUSTOMER: (customerId) => `/cart/${customerId}`,
  CART_ITEM_UPDATE: (customerId, itemId) => `/cart/${customerId}/item/${itemId}`,
  CART_ITEM_DELETE: (customerId, itemId) => `/cart/${customerId}/item/${itemId}`,
  CART_CLEAR: (customerId) => `/cart/${customerId}/clear`,
  
  // Invoice endpoints
  INVOICES: '/invoices',
  INVOICE_BY_ID: (id) => `/invoices/${id}`,
  
  // Payment endpoints
  PAYMENTS: '/payments',
  PAYMENT_BY_ID: (id) => `/payments/${id}`,
  PAYMENT_PREPARE: '/payments/prepare',
  PAYMENT_COMPLETE: '/payments/complete',
  PAYMENT_CANCEL: '/payments/cancel',
  PAYMENT_HISTORY_BY_CUSTOMER: (customerId) => `/payment-history/customer/${customerId}`,
  
  // Notification endpoints
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_BY_ID: (id) => `/notifications/${id}`,
  
  // Discount endpoints
  DISCOUNTS: '/discounts',
  DISCOUNT_BY_ID: (id) => `/discounts/${id}`,
  DISCOUNT_REDEEM: '/discounts/redeem',
  
  // Product Image endpoints
  PRODUCT_IMAGES: '/product-images',
  PRODUCT_IMAGES_BY_PRODUCT: (productId) => `/product-images/${productId}`,
  
  // Reports endpoints
  REPORTS: '/reports',
  REPORTS_DASHBOARD: '/reports/dashboard',
  REPORTS_DAILY: (date) => `/reports/daily/${date}`,
  REPORTS_DATE_RANGE: '/reports/date-range',
  REPORTS_MONTHLY: (year, month) => `/reports/monthly/${year}/${month}`,
  REPORTS_YEARLY: (year) => `/reports/yearly/${year}`,
  REPORTS_ITEM_WISE: '/reports/item-wise'
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
};

