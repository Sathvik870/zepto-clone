import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AdminAuthProvider } from "./context/admin/auth/AdminAuthProvider";
import { CustomerAuthProvider } from "./context/customer/auth/CustomerAuthProvider";
import { CartProvider } from "./context/customer/cart/CartProvider";
import { LocationProvider } from "./context/customer/location/LocationProvider";
import { AlertProvider } from "./context/common/AlertContext";
import { CategoryProvider } from "./context/customer/category/CategoryProvider";
import { SearchProvider } from "./context/customer/search/SearchProvider";
import { ProductProvider } from "./context/customer/product/ProductProvider";
import { SocketProvider } from "./context/common/socket/SocketProvider";
import { NotificationProvider } from "./context/admin/Notification/NotificationProvider";
import { SettingsProvider } from "./context/admin/settings/SettingsProvider";

import AdminLogin from "./pages/admin/AdminLoginPage";
// import AdminSignup from "./pages/admin/AdminSignupPage";
import Dashboard from "./pages/admin/Dashboard";
import ProductsPage from "./pages/admin/ProductsPage";
import PurchaseOrdersPage from "./pages/admin/PurchaseOrdersPage";
import SalesOrdersPage from "./pages/admin/SalesOrdersPage";
import InvoicesPage from "./pages/admin/InvoicesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import DailyTotalsPage from './pages/admin/DailyTotalsPage';

import LoginPage from "./pages/customer/CustomerLoginPage";
import SignupPage from "./pages/customer/CustomerSignupPage";
import ShoppingPage from "./pages/customer/ShoppingPage";
import CartPage from "./pages/customer/CartPage";
import ProfilePage from "./pages/customer/ProfilePage";
import OrdersPage from "./pages/customer/OrdersPage";

import MainLayout from "./layouts/admin/MainLayout";
import CustomerLayout from "./layouts/customer/CustomerLayout";

import AdminProtectedRoute from "./components/common/AdminProtectedRoute";
import PublicOnlyRoute from "./components/common/PublicOnlyRoute";

function App() {
  return (
    <SocketProvider>
      <CustomerAuthProvider>
        <AdminAuthProvider>
          <AlertProvider>
            <LocationProvider>
              <ProductProvider>
                <CartProvider>
                  <SearchProvider>
                    <CategoryProvider>
                      <Router>
                        <Routes>
                          <Route element={<CustomerLayout />}>
                            <Route path="/" element={<ShoppingPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/orders" element={<OrdersPage />} />
                          </Route>
                          <Route element={<PublicOnlyRoute />}>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                          </Route>

                          <Route path="/admin/login" element={<AdminLogin />} />
                          {/* <Route path="/admin/signup" element={<AdminSignup />} /> */}

                          {/* ProtectedRoutes */}
                          <Route element={<AdminProtectedRoute />}>
                            <Route
                              element={
                                <NotificationProvider>
                                  <SettingsProvider>
                                    <MainLayout />
                                  </SettingsProvider>
                                </NotificationProvider>
                              }
                            >
                              <Route
                                path="/admin/dashboard"
                                element={<Dashboard />}
                              />
                              <Route
                                path="/admin/products"
                                element={<ProductsPage />}
                              />
                              <Route
                                path="/admin/purchase-orders"
                                element={<PurchaseOrdersPage />}
                              />
                              <Route
                                path="/admin/sales-orders"
                                element={<SalesOrdersPage />}
                              />
                              <Route
                                path="/admin/invoices"
                                element={<InvoicesPage />}
                              />
                              <Route
                                path="/admin/settings"
                                element={<SettingsPage />}
                              />
                              <Route
                                path="/admin/daily-totals"
                                element={<DailyTotalsPage />}
                              />
                            </Route>
                          </Route>
                          <Route
                            path="*"
                            element={<div>404 - Page Not Found</div>}
                          />
                        </Routes>
                      </Router>
                    </CategoryProvider>
                  </SearchProvider>
                </CartProvider>
              </ProductProvider>
            </LocationProvider>
          </AlertProvider>
        </AdminAuthProvider>
      </CustomerAuthProvider>
    </SocketProvider>
  );
}

export default App;
