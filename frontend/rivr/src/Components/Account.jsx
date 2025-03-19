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
          height: "600px",
        },
      }}
    >
      <Typography variant="h6" sx={{ color: "#ffffff", fontWeight: "bold" }}>Account Details</Typography>
      <Typography variant="body1" sx={{ color: "#ccd6f6" }}>Username: admin</Typography>
      <Typography variant="body1" sx={{ color: "#ccd6f6" }}>Role: User</Typography>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }}
        sx={{ marginTop: "10px", backgroundColor: "#e63946", "&:hover": { backgroundColor: "#d62828" } }}
      >
        Logout
      </Button>
    </Popover>
  );
}

export default Account;
