import React from 'react';
import { Typography, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function DocumentVerifications({ userList }) {
  const navigate = useNavigate();

  // Filter users whose status is "N.V" (Not Verified)
  const notVerifiedUsers = userList.filter(user => user.status === "Not Verified");

  return (
    <div style={{ flex: 1, padding: "20px", color: "white", paddingTop: "40px", paddingBottom: "40px" }}>
      <Typography variant="h5" gutterBottom>
        Document Verifications
      </Typography>

      {/* Display a message if no users are found */}
      {notVerifiedUsers.length === 0 ? (
        <Typography variant="h6" style={{ color: "#778DA9" }}>
          No pending verifications.
        </Typography>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {notVerifiedUsers.map(user => (
            <Card 
              key={user.userID} 
              onClick={() => navigate(`/admin/document-verifications/id/${user.userID}`)}
              style={{ 
                width: "250px", 
                backgroundColor: "#0D1B2A", 
                color: "white", 
                padding: "10px", 
                borderRadius: "8px", 
                border: "1px solid #415A77",
                cursor: "pointer", 
                transition: "transform 0.2s ease-in-out" 
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <CardContent>
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2" color="#A5C9CA">Email: {user.email}</Typography>
                <Typography variant="body2" color="#A5C9CA">Phone: {user.phone}</Typography>
                <Typography variant="body2" color="#E63946">Status: Not Verified</Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentVerifications;
