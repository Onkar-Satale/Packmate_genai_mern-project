import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  // ⏳ wait until auth check completes
  if (loading) {
    return <p>Loading...</p>;
  }

  // 🔐 not logged in
  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}