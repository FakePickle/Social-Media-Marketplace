import React from "react";
import { Popover, Typography, Button } from "@mui/material";

function Account({ anchorEl, handleClose }) {
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
          src="profile_pic.png" 
          alt="Profile"
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: "2px solid #ccd6f6",
          }}
        />
      </div>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "10px" }}>
        <strong>Username:</strong> admin
      </Typography>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "10px" }}>
        <strong>Bio:</strong> This is a public bio. You can update it in your profile settings.
      </Typography>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "10px" }}>
        <strong>Role:</strong> User
      </Typography>

      <Typography variant="body1" sx={{ color: "#ccd6f6", marginBottom: "20px" }}>
        <strong>Address:</strong> 123 Main Street, City, Country
      </Typography>

      <Button
        variant="contained"
        color="secondary"
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/auth";
        }}
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
