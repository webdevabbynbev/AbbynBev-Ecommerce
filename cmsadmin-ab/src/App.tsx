import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./apps/ProtectedRoutes";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPage from "./pages/ForgotPage";
import MasterPage from "./pages/MasterPage";
import AddProductPage from "./pages/AddProductPage";
import ProductMediasPage from "./admin/products/[id]/medias/page";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root ke dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/products/:id/medias"
          element={
            <ProtectedRoute>
              <ProductMediasPage />
            </ProtectedRoute>
          }
        />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot" element={<ForgotPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Semua route modul CMS */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MasterPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ Tambahkan route untuk form product */}
        <Route
          path="/product-form"
          element={
            <ProtectedRoute>
              <AddProductPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback terakhir */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
