import "./App.css";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import UserVerificationPage from "./pages/UserVerificationPage";
import AdminAuth from "./pages/AdminAuth";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";

function App() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/home" />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;