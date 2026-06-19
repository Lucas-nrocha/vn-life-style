import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';

import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { Category } from './pages/Category';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Wishlist } from './pages/Wishlist';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { NotFound } from './pages/NotFound';

import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminCategories } from './pages/admin/AdminCategories';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#111111',
                border: '1px solid #222222',
                color: '#f5f5f5',
              },
            }}
          />

          <Routes>
            <Route
              path="/"
              element={
                <AppLayout>
                  <Home />
                </AppLayout>
              }
            />
            <Route
              path="/produtos"
              element={
                <AppLayout>
                  <Products />
                </AppLayout>
              }
            />
            <Route
              path="/categoria/:slug"
              element={
                <AppLayout>
                  <Category />
                </AppLayout>
              }
            />
            <Route
              path="/produtos/:id"
              element={
                <AppLayout>
                  <ProductDetail />
                </AppLayout>
              }
            />
            <Route
              path="/carrinho"
              element={
                <AppLayout>
                  <Cart />
                </AppLayout>
              }
            />
            <Route
              path="/checkout"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <CheckoutSuccess />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/checkout/failure"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <CheckoutSuccess />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/checkout/pending"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <CheckoutSuccess />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/login"
              element={
                <AppLayout>
                  <Login />
                </AppLayout>
              }
            />
            <Route
              path="/cadastro"
              element={
                <AppLayout>
                  <Register />
                </AppLayout>
              }
            />
            <Route
              path="/esqueci-senha"
              element={
                <AppLayout>
                  <ForgotPassword />
                </AppLayout>
              }
            />
            <Route
              path="/redefinir-senha"
              element={
                <AppLayout>
                  <ResetPassword />
                </AppLayout>
              }
            />
            <Route
              path="/perfil"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/pedidos"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/pedidos/:id"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/favoritos"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                </AppLayout>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="pedidos" element={<AdminOrders />} />
              <Route path="produtos" element={<AdminProducts />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="cupons" element={<AdminCoupons />} />
              <Route path="categorias" element={<AdminCategories />} />
            </Route>

            <Route
              path="*"
              element={
                <AppLayout>
                  <NotFound />
                </AppLayout>
              }
            />
          </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
