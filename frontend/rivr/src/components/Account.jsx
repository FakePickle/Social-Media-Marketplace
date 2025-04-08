import React, { useContext } from "react";
import { Popover, Typography, Button } from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";

function Account({ anchorEl, handleClose }) {
  const { userData, logout } = useContext(AuthContext);
  const open = Boolean(anchorEl);
  const id = open ? "account-popover" : undefined;

  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      sx={{
        marginLeft: "70px",
        "& .MuiPaper-root": {
          backgroundColor: "#415A77",
          color: "#ffffff",
          borderRadius: "10px",
          padding: "15px",
          minWidth: "400px",
          height: "auto",
        },
      }}
    >
      <Typography variant="h6" sx={{ color: "#ffffff", fontWeight: "bold", marginBottom: "15px" }}>
        Account Details
      </Typography>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <img
          src={userData?.profile_picture_url || "/default-profile.png"}
          alt="Profile"
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: "2px solid #ccd6f6",
            objectFit: "cover",
          }}
        />
      </div>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "10px" }}>
        <strong>Username:</strong> {userData?.username || "N/A"}
      </Typography>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "10px" }}>
        <strong>Email:</strong> {userData?.email || "N/A"}
      </Typography>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "10px" }}>
        <strong>Bio:</strong> {userData?.bio || "No bio available"}
      </Typography>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "10px" }}>
        <strong>Role:</strong> {userData?.is_staff ? "Admin" : "User"}
      </Typography>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "20px" }}>
        <strong>Joined:</strong> {userData?.date_joined ? new Date(userData.date_joined).toLocaleDateString() : "N/A"}
      </Typography>

      <Button
        variant="contained"
        color="secondary"
        onClick={logout}
        sx={{
          marginTop: "10px",
          backgroundColor: "#e63946",
          "&:hover": { backgroundColor: "#d62828" },
        }}
      >
        Logout
      </Button>
    </Popover>
  );
}

export default Account;
