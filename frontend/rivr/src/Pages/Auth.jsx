import { Card, TextField, Button, Typography } from "@mui/material";
import React, { useState } from "react";

function Auth() {
  const [isSwapped, setIsSwapped] = useState(false);
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("user123");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const defaultUser = { username: "user", password: "user123" };

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };
  const hadleUserRegistering = () => {
    setIsRegistering(true);
  }
  const handleIsConfirming = () => {
    setIsRegistering(false);
    setIsConfirming(true);
  }
  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      alert("Username and password cannot be empty");
      return;
    }
    if (username === defaultUser.username && password === defaultUser.password) {
      localStorage.setItem("token", "dummy-token");
      localStorage.setItem("user", JSON.stringify({ username: "user", role: "user" }));
      window.location.href = "/home"; // Redirect to home
    } else {
      alert("Invalid Credentials");
    }
  };
  const handleVerificationInput = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
    }
  };
  const handleVirtualKeyPress = (value) => {
    const emptyIndex = verificationCode.findIndex((digit) => digit === "");
    if (emptyIndex !== -1) {
      handleVerificationInput(emptyIndex, value);
    }
  };
  const handleDeletePress = () => {
    const filledIndex = verificationCode.findLastIndex((digit) => digit !== "");
    if (filledIndex !== -1) {
      handleVerificationInput(filledIndex, "");
    }
  };
  const handleConfirmSignUp = () => {
    setIsConfirming(false)
    window.location.href = "/home";
  }
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };
  if (isConfirming){
    return(
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
        <Card
          sx={{
            width: "50vh",
            height: "60vh",
            backgroundColor: "#e0e1dd",
            color: "black",
            borderRadius: "25px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <Typography variant="h4" sx={{ marginBottom: "15px", fontWeight: "bold" }}>
            Enter 6-Digit Code
          </Typography>
          <div style={{ display: "flex", gap: "10px" }}>
            {verificationCode.map((digit, index) => (
              <TextField
                key={index}
                variant="outlined"
                inputProps={{ maxLength: 1, style: { textAlign: "center" }, readOnly: true }}
                value={digit}
                onChange={(e) => handleVerificationInput(index, e.target.value)}
              />
            ))}
          </div>
          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[...Array(9).keys()].map((num) => (
              <Button key={num + 1} sx={{ width: "100%", backgroundColor: "#415a77","&:hover": { backgroundColor: "#1b263b" } }} variant="contained" onClick={() => handleVirtualKeyPress(String(num + 1))}>
                {num + 1}
              </Button>
            ))}
            <Button variant="contained" sx={{ width: "100%", backgroundColor: "#415a77","&:hover": { backgroundColor: "#1b263b" } }} onClick={() => handleVirtualKeyPress("0")}>
              0
            </Button>
            <Button variant="contained" sx={{ width: "100%", backgroundColor: "#B42828","&:hover": { backgroundColor: "#FF0000" } }} onClick={handleDeletePress}>
              Delete
            </Button>
          </div>
          <Button variant="contained" onClick = {handleConfirmSignUp} sx={{width:"50%", marginTop: "20px", backgroundColor: "#415a77" }}>
            Verify
          </Button>
        </Card>
      </div>
    )
  }
  if (isRegistering) {
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
        <Card
          sx={{
            width: "50vh",
            height: "50vh",
            backgroundColor: "#e0e1dd",
            color: "black",
            borderRadius: "25px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <Typography variant="h5" sx={{ marginBottom: "15px", fontWeight: "bold" }}>
            Scan QR Code to Sign Up with Google
          </Typography>
          <img src="./G_Auth_QR_Code.png" alt="Google Auth QR" style={{ width: "300px", height: "300px", marginBottom: "20px" }} />
          <Typography variant="body2" sx={{paddingBottom:"10px"}}>Use your phone to scan the QR code and then click NEXT.</Typography>
          <Button variant="contained" onClick={handleIsConfirming}  sx={{ width: "100%", backgroundColor: "#415a77","&:hover": { backgroundColor: "#1b263b" } }}>
                Next
          </Button>
        </Card>
      </div>
    );
  }

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
                Log In
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
                Don't have an account?
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
              <Button variant="contained" onClick = {hadleUserRegistering} sx={{ width: "100%", backgroundColor: "#415a77", "&:hover": { backgroundColor: "#1b263b" } }}>
                Register
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Auth;
