import React, { useContext, useState, useEffect } from "react";
import { Box, TextField, Button, Typography, Avatar } from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";

function Settings() {
  const { userData, setUserData } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: userData?.username || "",
    bio: userData?.bio || "",
    address: userData?.address || "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userData?.profile_picture_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    console.log("Current userData:", userData);
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");
    console.log("Form data:", formData);
    console.log("Profile picture:", profilePicture);
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("bio", formData.bio);
      formDataToSend.append("address", formData.address);
      if (profilePicture) {
        formDataToSend.append("profile_picture", profilePicture);
      }

      const response = await api.put("user/profile/", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        console.log("Profile update response:", response.data);
        setUserData(response.data);
        setSuccess(true);
        setProfilePicture(null);
        setError(null); // Clear any existing errors
      }
    } catch (err) {
      console.error("Profile update error:", err);
      console.error("Error response:", err.response?.data);
      
      // Handle specific error cases
      if (err.response?.data?.username) {
        setError(`Username error: ${err.response.data.username[0]}`);
      } else if (err.response?.data?.profile_picture) {
        setError(`Profile picture error: ${err.response.data.profile_picture[0]}`);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 600,
        mx: "auto",
        p: 3,
        backgroundColor: "#415A77",
        borderRadius: 2,
        color: "#ffffff",
      }}
    >
      <Typography variant="h5" sx={{ mb: 3, color: "#ffffff" }}>
        Profile Settings
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
        <Avatar
          src={previewUrl || userData?.profile_picture_url}
          sx={{ width: 100, height: 100, mb: 2 }}
        />
        <Button
          variant="contained"
          component="label"
          sx={{ backgroundColor: "#e63946", "&:hover": { backgroundColor: "#d62828" } }}
        >
          Change Profile Picture
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
        margin="normal"
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#ccd6f6" },
            "&:hover fieldset": { borderColor: "#ffffff" },
          },
          "& .MuiInputLabel-root": { color: "#ccd6f6" },
          "& .MuiInputBase-input": { color: "#ffffff" },
        }}
      />

      <TextField
        fullWidth
        label="Bio"
        name="bio"
        value={formData.bio}
        onChange={handleInputChange}
        margin="normal"
        multiline
        rows={4}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#ccd6f6" },
            "&:hover fieldset": { borderColor: "#ffffff" },
          },
          "& .MuiInputLabel-root": { color: "#ccd6f6" },
          "& .MuiInputBase-input": { color: "#ffffff" },
        }}
      />

      <TextField
        fullWidth
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleInputChange}
        margin="normal"
        multiline
        rows={2}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#ccd6f6" },
            "&:hover fieldset": { borderColor: "#ffffff" },
          },
          "& .MuiInputLabel-root": { color: "#ccd6f6" },
          "& .MuiInputBase-input": { color: "#ffffff" },
        }}
      />

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {success && (
        <Typography color="success" sx={{ mt: 2 }}>
          Profile updated successfully!
        </Typography>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{
          mt: 3,
          backgroundColor: "#e63946",
          "&:hover": { backgroundColor: "#d62828" },
        }}
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </Box>
  );
}

export default Settings;
