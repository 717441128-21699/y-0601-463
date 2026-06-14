import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import TrendAnalysis from "@/pages/TrendAnalysis";
import EquipmentManagement from "@/pages/EquipmentManagement";
import ProductionReport from "@/pages/ProductionReport";
import SystemSettings from "@/pages/SystemSettings";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserRole } from "@/types";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: UserRole }) {
  const { isAuthenticated, currentUser } = useAuthStore();

  useEffect(() => {
    document.title = "3D智慧水厂可视化平台";
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser) {
    const roles: UserRole[] = ['operator', 'supervisor', 'manager'];
    if (roles.indexOf(currentUser.role) < roles.indexOf(requiredRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/trend" 
          element={
            <ProtectedRoute>
              <TrendAnalysis />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/equipment" 
          element={
            <ProtectedRoute requiredRole="supervisor">
              <EquipmentManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/report" 
          element={
            <ProtectedRoute requiredRole="supervisor">
              <ProductionReport />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute requiredRole="manager">
              <SystemSettings />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
