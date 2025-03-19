import './App.css';
import Auth from './Pages/Auth';
import Home from './Pages/Home';
import ProtectedRoute from './Components/ProtectedRoute';
import AdminDashboard from './Pages/AdminDashboard';
import AdminRoute from './Components/AdminRoute';
import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom";
function App() {
  const isAuthenticated = localStorage.getItem("token") !== null;
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/home" element={<Home />} />
          {/* <Route path="/profile/:username" element={<Profile />} />
          <Route path="/marketplace" element={<Marketplace />} /> */}
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute user={user} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
