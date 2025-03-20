import { Card, TextField, Button, Typography } from "@mui/material";
import React, { useState } from "react";

function AdminAuth() {
  const [isSwapped, setIsSwapped] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const defaultUser = { username: "admin", password: "admin123" };

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      alert("Username and password cannot be empty");
      return;
    }
    if (username === defaultUser.username && password === defaultUser.password) {
      localStorage.setItem("token", "dummy-token");
      localStorage.setItem("admin", JSON.stringify({ username: "admin", role: "admin" }));
      window.location.href = "/admin"; // Redirect to admin
    } else {
      alert("Invalid Credentials");
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#1b263b",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", top: "20px", left: "20px" }}>
        <img src="/logo.png" alt="Rivr." style={{ width: "125px" }} />
      </div>

      <div style={{ display: "flex" }}>
        <Card
          sx={{
            width: isSwapped ? "30vh" : "65vh",
            height: "50vh",
            backgroundColor: isSwapped ? "#0d1b2a" : "#e0e1dd",
            color: isSwapped ? "white" : "black",
            borderTopLeftRadius: "25px",
            borderBottomLeftRadius: "25px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            transition: "all 0.3s ease",
          }}
        >
          {!isSwapped ? (
            <>
              <Typography variant="h5" sx={{ marginBottom: "15px", fontWeight: "bold" }}>
                Administrator Log-In
              </Typography>
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "10px" }}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "20px" }}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                variant="contained"
                sx={{ width: "100%", backgroundColor: "#415a77", "&:hover": { backgroundColor: "#1b263b" } }}
                onClick={handleLogin}
                
              >
                Log In
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ marginBottom: "15px", textAlign: "center" }}>
                Already have an account?
              </Typography>
              <Button
                variant="outlined"
                onClick={handleSwap}
                sx={{
                  width: "80%",
                  color: "white",
                  borderColor: "white",
                  "&:hover": { backgroundColor: "#1b263b" },
                }}
              >
                Log In
              </Button>
            </>
          )}
        </Card>

        <Card
          sx={{
            width: isSwapped ? "65vh" : "30vh",
            height: "50vh",
            backgroundColor: isSwapped ? "#e0e1dd" : "#0d1b2a",
            color: isSwapped ? "black" : "white",
            borderTopRightRadius: "25px",
            borderBottomRightRadius: "25px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            transition: "all 0.3s ease",
          }}
        >
          {!isSwapped ? (
            <>
              <Typography variant="h6" sx={{ marginBottom: "15px", textAlign: "center" }}>
                Don't have an admin account?
              </Typography>
              <Button
                variant="outlined"
                onClick={handleSwap}
                sx={{
                  width: "80%",
                  color: "white",
                  borderColor: "white",
                  "&:hover": { backgroundColor: "#1b263b" },
                }}
              >
                Register
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h5" sx={{ marginBottom: "15px", fontWeight: "bold" }}>
                Register
              </Typography>
              <TextField label="Username" variant="outlined" fullWidth sx={{ marginBottom: "10px" }} />
              <TextField label="Email" type="email" variant="outlined" fullWidth sx={{ marginBottom: "10px" }} />
              <TextField label="Phone Number" type="tel" variant="outlined" fullWidth sx={{ marginBottom: "10px" }} />
              <TextField label="Password" type="password" variant="outlined" fullWidth sx={{ marginBottom: "20px" }} />
              <Button variant="contained" sx={{ width: "100%", backgroundColor: "#415a77", "&:hover": { backgroundColor: "#1b263b" } }}>
                Register
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AdminAuth;
