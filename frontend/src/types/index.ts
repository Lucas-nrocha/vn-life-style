export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  sku: string;
  featured: boolean;
  active: boolean;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Pick<Product, 'id' | 'name' | 'price' | 'images'> & { active: boolean };
  variant: Pick<ProductVariant, 'id' | 'size' | 'color' | 'stock' | 'sku'>;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: { name: string; images: ProductImage[] };
  variant: { size: string; color: string };
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  method?: string;
  amount: number;
  paidAt?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  couponCode?: string;
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
  address: Address;
  items: OrderItem[];
  payment?: Payment;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrder?: number | null;
  maxUses?: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  featured?: boolean;
  page?: number;
}
