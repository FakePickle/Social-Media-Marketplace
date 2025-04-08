import React, { useState } from "react";
import { TextField, Button, Typography, Avatar, Paper, Divider } from "@mui/material";

function Settings() {
  const [username, setUsername] = useState("admin");
  const [profilePicture, setProfilePicture] = useState("https://via.placeholder.com/100");
  const [bio, setBio] = useState("This is a public bio.");
  const [address, setAddress] = useState("123 Main Street, City, Country");

  const handleSave = () => {
    alert("Account details updated successfully!");
    console.log("Updated Details:", { username, profilePicture, bio, address });
  };

  return (
    <Paper
      elevation={4}
      sx={{
        padding: "30px",
        maxWidth: "700px",
        margin: "40px auto",
        backgroundColor: "#0D1B2A",
        borderRadius: "16px",
        color: "#E0E1DD",
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ color: "#E0E1DD", fontWeight: "bold" }}>
        Edit Account Details
      </Typography>

      <Divider sx={{ backgroundColor: "#E0E1DD", marginBottom: "30px" }} />

      {/* Profile Preview */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "25px" }}>
        <Avatar src={profilePicture} alt="Profile" sx={{ width: 80, height: 80, marginRight: 2 }} />
        <Typography variant="subtitle1">Preview</Typography>
      </div>

      {/* Username Field */}
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        sx={{ marginBottom: "20px" }}
        InputLabelProps={{ style: { color: "#E0E1DD" } }}
        InputProps={{
          style: { color: "#E0E1DD" },
        }}
      />

      {/* Profile Picture Field */}
      <TextField
        label="Profile Picture URL"
        variant="outlined"
        fullWidth
        value={profilePicture}
        onChange={(e) => setProfilePicture(e.target.value)}
        sx={{ marginBottom: "20px" }}
        InputLabelProps={{ style: { color: "#E0E1DD" } }}
        InputProps={{
          style: { color: "#E0E1DD" },
        }}
      />

      {/* Bio Field */}
      <TextField
        label="Public Bio"
        variant="outlined"
        fullWidth
        multiline
        rows={4}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        sx={{ marginBottom: "20px" }}
        InputLabelProps={{ style: { color: "#E0E1DD" } }}
        InputProps={{
          style: { color: "#E0E1DD" },
        }}
      />

      {/* Address Field */}
      <TextField
        label="Address"
        variant="outlined"
        fullWidth
        multiline
        rows={2}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        sx={{ marginBottom: "30px" }}
        InputLabelProps={{ style: { color: "#E0E1DD" } }}
        InputProps={{
          style: { color: "#E0E1DD" },
        }}
      />

      {/* Save Button */}
      <Button
        variant="contained"
        onClick={handleSave}
        fullWidth
        sx={{
          backgroundColor: "#778DA9",
          color: "#1B263B",
          fontWeight: "bold",
          padding: "12px",
          borderRadius: "12px",
          textTransform: "none",
          '&:hover': {
            backgroundColor: "#90A4B9",
          },
        }}
      >
        Save Changes
      </Button>
    </Paper>
  );
}

export default Settings;
