import React, { useState } from "react";
import { TextField, Button, Typography } from "@mui/material";

function Settings() {
  const [username, setUsername] = useState("admin"); // Default username
  const [profilePicture, setProfilePicture] = useState("https://via.placeholder.com/100"); // Default profile picture
  const [bio, setBio] = useState("This is a public bio."); // Default bio

  const handleSave = () => {
    alert("Account details updated successfully!");
    console.log("Updated Details:", { username, profilePicture, bio });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", backgroundColor: "#1B263B", borderRadius: "10px", color: "#E0E1DD" }}>
      <Typography variant="h4" style={{ marginBottom: "20px", color: "#E0E1DD" }}>
        Edit Account Details
      </Typography>

      {/* Username Field */}
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: "20px" }}
        InputLabelProps={{ style: { color: "#E0E1DD" } }}
        InputProps={{
          style: { color: "#E0E1DD", borderColor: "#778DA9" },
        }}
      />

      {/* Profile Picture Field */}
      <TextField
        label="Profile Picture URL"
        variant="outlined"
        fullWidth
        value={profilePicture}
        onChange={(e) => setProfilePicture(e.target.value)}
        style={{ marginBottom: "20px" }}
        InputLabelProps={{ style: { color: "#E0E1DD" } }}
        InputProps={{
          style: { color: "#E0E1DD", borderColor: "#778DA9" },
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
        style={{ marginBottom: "20px" }}
        InputLabelProps={{ style: { color: "#E0E1DD" } }}
        InputProps={{
          style: { color: "#E0E1DD", borderColor: "#778DA9" },
        }}
      />

      {/* Save Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        style={{ backgroundColor: "#778DA9", color: "#1B263B" }}
      >
        Save Changes
      </Button>
    </div>
  );
}

export default Settings;