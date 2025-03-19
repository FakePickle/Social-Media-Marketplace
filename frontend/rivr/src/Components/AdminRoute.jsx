import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = ({ user }) => {
  return user?.role === "admin" ? <Outlet /> : <Navigate to="/auth" />;
};

export default AdminRoute;
