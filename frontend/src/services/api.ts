import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isRefreshCall = original?.url?.includes('/api/auth/refresh-token');

    if (error.response?.status === 401 && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || ''}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        accessToken = data.accessToken;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        accessToken = null;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  refreshToken: () => api.post('/api/auth/refresh-token'),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/api/auth/reset-password', { token, password }),
};

export const productApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/products', { params }),
  get: (id: string) => api.get(`/api/products/${id}`),
  create: (data: unknown) => api.post('/api/products', data),
  update: (id: string, data: unknown) => api.put(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
  addVariant: (productId: string, data: { size: string; color: string; stock: number }) =>
    api.post(`/api/products/${productId}/variants`, data),
  updateVariant: (productId: string, variantId: string, data: { size?: string; color?: string; stock?: number }) =>
    api.put(`/api/products/${productId}/variants/${variantId}`, data),
  deleteVariant: (productId: string, variantId: string) =>
    api.delete(`/api/products/${productId}/variants/${variantId}`),
  getReviews: (productId: string) => api.get(`/api/products/${productId}/reviews`),
  createReview: (productId: string, data: { rating: number; comment?: string }) =>
    api.post(`/api/products/${productId}/reviews`, data),
  deleteReview: (productId: string) => api.delete(`/api/products/${productId}/reviews`),
};

export const cartApi = {
  get: () => api.get('/api/cart'),
  add: (variantId: string, quantity: number) => api.post('/api/cart', { variantId, quantity }),
  update: (itemId: string, quantity: number) => api.put(`/api/cart/${itemId}`, { quantity }),
  remove: (itemId: string) => api.delete(`/api/cart/${itemId}`),
};

export const orderApi = {
  create: (data: { addressId: string; couponCode?: string; notes?: string }) =>
    api.post('/api/orders', data),
  list: (page?: number) => api.get('/api/orders', { params: { page } }),
  get: (id: string) => api.get(`/api/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put(`/api/orders/${id}/status`, { status }),
  validateCoupon: (code: string) =>
    api.get('/api/orders/validate-coupon', { params: { code } }),
  cancel: (id: string) => api.post(`/api/orders/${id}/cancel`),
};

export const checkoutApi = {
  createPayment: (orderId: string) => api.post('/api/checkout/create-payment', { orderId }),
  getOrderStatus: (orderId: string) => api.get(`/api/checkout/order-status/${orderId}`),
};

export const userApi = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data: unknown) => api.put('/api/user/profile', data),
  getAddresses: () => api.get('/api/user/addresses'),
  createAddress: (data: unknown) => api.post('/api/user/addresses', data),
  updateAddress: (id: string, data: unknown) => api.put(`/api/user/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/api/user/addresses/${id}`),
};

export const wishlistApi = {
  get: () => api.get('/api/wishlist'),
  toggle: (productId: string) => api.post(`/api/wishlist/${productId}`),
};

export const newsletterApi = {
  subscribe: (email: string) => api.post('/api/newsletter/subscribe', { email }),
};

export const uploadApi = {
  uploadProductImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ url: string }>('/api/admin/upload/produtos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const adminApi = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getOrders: (params?: Record<string, unknown>) => api.get('/api/admin/orders', { params }),
  getProducts: (params?: Record<string, unknown>) => api.get('/api/admin/products', { params }),
  getUsers: (params?: Record<string, unknown>) => api.get('/api/admin/users', { params }),
  createCategory: (data: { name: string; imageUrl?: string }) =>
    api.post('/api/admin/categories', data),
  addTracking: (orderId: string, trackingCode: string) =>
    api.put(`/api/admin/orders/${orderId}/tracking`, { trackingCode }),
  exportOrdersCsv: () => api.get('/api/admin/orders/export-csv', { responseType: 'blob' }),
  getCategories: (all?: boolean) => api.get('/api/admin/categories', { params: all ? { all: 'true' } : {} }),
  updateCategory: (id: string, data: unknown) => api.put(`/api/admin/categories/${id}`, data),
  getCoupons: () => api.get('/api/admin/coupons'),
  createCoupon: (data: unknown) => api.post('/api/admin/coupons', data),
  updateCoupon: (id: string, data: unknown) => api.put(`/api/admin/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/api/admin/coupons/${id}`),
  refundOrder: (id: string) => api.post(`/api/admin/orders/${id}/refund`),
};
