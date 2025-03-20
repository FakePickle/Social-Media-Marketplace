import './App.css';
import Auth from './Pages/Auth';
import Home from './Pages/Home';
import ProtectedRoute from './Components/ProtectedRoute';
import AdminDashboard from './Pages/AdminDashboard';
import AdminRoute from './Components/AdminRoute';
import UserVerificationPage from './Pages/UserVerificationPage';
import AdminAuth from './Pages/AdminAuth';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import { useState } from 'react';
function App() {
  const isAuthenticated = localStorage.getItem("token") !== null;
  const user = JSON.parse(localStorage.getItem("user"));
  const [userList, setUserList] = useState([
    {
      userID: "1",
      name: "Jhon Doe",
      email: "jhondoe@gmail.com",
      phone: "123456789",
      status: "Verified",
      createdAt: "7/3/2025",
      updatedAt: "9/3/2025",
    },
    {
      userID: "2",
      name: "Harsh",
      email: "harsh@gmail.com",
      phone: "987654321",
      status: "Verified",
      createdAt: "9/3/2025",
      updatedAt: "9/3/2025",
    },
    {
      userID: "3",
      name: "Sarath",
      email: "sarath@gmail.com",
      phone: "135780246",
      status: "Not Verified",
      createdAt: "9/3/2025",
      updatedAt: "9/3/2025",
    },
  ]);
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin_auth" element={<AdminAuth />}/>
        {/* Protected Routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/home" element={<Home />} />
          {/* <Route path="/profile/:username" element={<Profile />} />
          <Route path="/marketplace" element={<Marketplace />} /> */}
        </Route>

        {/* Admin Routes */}
        {/* <Route element={<AdminRoute user={user} />}> */}
          <Route path="/admin" element={<AdminDashboard userList={userList}/>} />
          <Route path="/admin/document-verifications/id/:id" element={<UserVerificationPage userList={userList} setUserList={setUserList} />} />
        {/* </Route> */}
        {/* Redirect all unknown routes to Auth */}
        <Route path="*" element={<h1 style={{ color: "white", backgroundColor:"#0D1B2A" }}>404 Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
