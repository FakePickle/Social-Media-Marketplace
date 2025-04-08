import { Card, TextField, Button, Typography } from "@mui/material";
import React, { useState } from "react";

function ForgotPassw() {
    const [isSwapped, setIsSwapped] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (confirmPassword && e.target.value !== confirmPassword) {
      setError("Passwords do not match");
    } else {
      setError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (password && e.target.value !== password) {
      setError("Passwords do not match");
    } else {
      setError("");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={{ position: "absolute", top: "20px", left: "20px" }}>
        <img src="/logo.png" alt="Rivr." style={{ width: "125px" }} />
      </div>

      <div style={{ display: "flex" }}>
        <Card sx={isSwapped ? styles.swappedCard : styles.activeCard}>
          {!isSwapped ? (
            <>
              <Typography variant="h4" sx={styles.title}>
                Forgot Password
              </Typography>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "10px" }}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "20px" }}
                onChange={handlePasswordChange}
              />
              <TextField
                label="Confirm Password"
                type="password"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "20px" }}
                onChange={handleConfirmPasswordChange}
              />
              {error && (
                <Typography color="error" sx={{ marginBottom: "20px" }}>
                  {error}
                </Typography>
              )}
              <Button
                variant="contained"
                sx={styles.actionButton}
                disabled={!!error || !password || !confirmPassword}
              >
                Log In
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ marginBottom: "15px", textAlign: "center" }}>
                Already have an account?
              </Typography>
              <Button variant="outlined" onClick={handleSwap} sx={styles.swapButton}>
                Log In
              </Button>
            </>
          )}
        </Card>

        {/* <Card sx={isSwapped ? styles.activeCard : styles.swappedCard}>
          {}
        </Card> */}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    backgroundColor: "#1b263b",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCard: {
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
  },
  registerCard: {
    width: "auto",
    height: "auto",
    backgroundColor: "#e0e1dd",
    color: "black",
    borderRadius: "25px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    textAlign: "center",
  },
  activeCard: {
    width: "65vh",
    height: "50vh",
    backgroundColor: "#e0e1dd",
    color: "black",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    transition: "all 0.3s ease",
  },
  swappedCard: {
    width: "30vh",
    height: "50vh",
    backgroundColor: "#0d1b2a",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    transition: "all 0.3s ease",
  },
  title: {
    marginBottom: "15px",
    fontWeight: "bold",
  },
  keypad: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  keyButton: {
    width: "100%",
    backgroundColor: "#415a77",
    "&:hover": { backgroundColor: "#1b263b" },
  },
  deleteButton: {
    width: "100%",
    backgroundColor: "#B42828",
    "&:hover": { backgroundColor: "#FF0000" },
  },
  verifyButton: {
    width: "50%",
    marginTop: "20px",
    backgroundColor: "#415a77",
  },
  actionButton: {
    width: "100%",
    backgroundColor: "#415a77",
    "&:hover": { backgroundColor: "#1b263b" },
  },
  swapButton: {
    width: "80%",
    color: "white",
    borderColor: "white",
    "&:hover": { backgroundColor: "#1b263b" },
  },
};

export default ForgotPassw;
