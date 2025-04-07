import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, CardContent, Button, AppBar, Toolbar } from '@mui/material';

function UserVerificationPage({ userList, setUserList }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find the user by ID
  const user = userList.find(user => user.userID.toString() === id);

  if (!user) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        <Typography variant="h5" color="error">
          User not found!
        </Typography>
      </div>
    );
  }

  // Handle verification
  const handleVerify = () => {
    const updatedUsers = userList.map(u =>
      u.userID === user.userID ? { ...u, status: "Verified" } : u
    );
    setUserList(updatedUsers);
    navigate("/admin"); // Redirect after verification
  };

  // Handle rejection
  const handleReject = () => {
    alert("User verification rejected!"); // Replace with API call if needed
    navigate("/admin"); // Redirect after rejection
  };

  return (
    <div style={{ flex: 1, color: "white", backgroundColor: "#1B263B", minHeight: "100vh" }}>
      {/* Top Bar */}
      <AppBar position="static" style={{ backgroundColor: "#0D1B2A" }}>
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1, color: "white" }}>
            User Verification - {user.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
        <Card 
          style={{ 
            width: "400px", 
            backgroundColor: "#0D1B2A", 
            color: "white", 
            padding: "20px", 
            borderRadius: "8px", 
            border: "1px solid #415A77",
          }}
        >
          <CardContent>
            <Typography variant="h5">{user.name}</Typography>
            <Typography variant="body2" color="#A5C9CA">Email: {user.email}</Typography>
            <Typography variant="body2" color="#A5C9CA">Phone: {user.phone}</Typography>
            <Typography variant="body2" color={user.status === "Not Verified" ? "#E63946" : "#1B998B"}>
              Status: {user.status === "Not Verified" ? "Not Verified" : "Verified"}
            </Typography>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <Button variant="contained" style={{ backgroundColor: "#1B998B", color: "white" }} onClick={handleVerify}>
                Approve
              </Button>
              <Button variant="contained" style={{ backgroundColor: "#E63946", color: "white" }} onClick={handleReject}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UserVerificationPage;
