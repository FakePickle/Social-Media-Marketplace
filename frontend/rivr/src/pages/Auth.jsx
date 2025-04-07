import { Card, TextField, Button, Typography } from "@mui/material";
import React, { useContext, useState, useEffect} from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function Auth() {
  const { login, register, verifyData, verifyEmail, verifyTotp } = useContext(AuthContext);  const [isSwapped, setIsSwapped] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  // const { isAuthenticated} = useContext(AuthContext)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [totpSecretKey, settotpSecretKey] = useState("");
  const [dob, setDob] = useState("");



  const navigate = useNavigate();
  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };

  useEffect(() => {
    return () => {
      // Cleanup sensitive state on unmount
      setEmail("")
      setPassword("")
      setFirstName("")
      setUsername("")
      setLastName("")
      setVerificationCode(["", "", "", "", "", ""])
      setQrCodeURL("")
      settotpSecretKey("")
    };
  }, []);

  const handleEmailVerification = async () => {
    try {
      const otp = verificationCode.join("");
      await verifyEmail(otp, email);
      const [message, instructions, qrCodeURL, totp_uri] = await register(
        email,
        username,
        password,
        firstName,
        lastName,
        dob
      );
      setQrCodeURL(qrCodeURL);
      settotpSecretKey(totp_uri);
      setIsConfirmingEmail(false);
      setIsRegistering(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDataVerification = async () => {
    try {
      await verifyData(username, password, email, firstName, lastName, dob);
      setIsConfirmingEmail(true);
    } catch (error) {
      alert(error.message);
    }
  };

  // const handleUserRegistering = async () => {
  //   if (!username.trim() || !password.trim() || !email.trim() || !firstName.trim() || !lastName.trim() || !dob) {
  //     alert("All fields are required.");
  //     return;
  //   }
  //   if (!isValidEmail(email)) {
  //     alert("Please enter a valid email address.");
  //     return;
  //   }
  //   try {
  //     const [message, instructions, qrCodeURL, totp_uri] = await register(
  //       email,
  //       username,
  //       password,
  //       firstName,
  //       lastName,
  //       dob
  //     );
  
  //     console.log("Message:", message);
  //     console.log("Instructions:", instructions);
  //     console.log("QR Code:", qrCodeURL);
  //     console.log("TOTP URI:", totp_uri);
  
  //     setQrCodeURL(qrCodeURL);
  //     settotpSecretKey(totp_uri);
  //     setIsRegistering(true);
  //   } catch (error) {
  //     alert(error?.error || "Registration failed");
  //   }
  // };

  const handleIsConfirming = () => {
    setIsConfirming(true);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      alert("Email and password cannot be empty");
      return;
    }
    try {
      await login(email, password);
      setIsConfirming(true)
      
    } catch (err) {
      alert(err.error || "Login failed");
    }
  };

  const handleVerificationInput = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
    }
  };

  // const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
  const handleLoginConfirmSignUp = async () => {
    try {
      const otp = verificationCode.join("");
      await verifyTotp(otp, email);
      navigate("/home");
    } catch (error) {
      alert(error.message);
    }
  };
  
  const handleRegisterConfirmSignUp = async () => {
    try {
      const otp = verificationCode.join("");
      await verifyTotp(otp, email);
      // Reset state after successful registration
      setIsSwapped(false);
      setEmail("");
      setPassword("");
      setFirstName("");
      setUsername("");
      setLastName("");
      setDob("");
      setIsRegistering(false);
      setIsConfirming(false);
      setVerificationCode(["", "", "", "", "", ""]);
      setQrCodeURL("");
      settotpSecretKey("");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };
  if (isConfirmingEmail){
    return (
    <div style={styles.wrapper}>
        <div style={{ position: "absolute", top: "20px", left: "20px" }}>
        <img src="/logo.png" alt="Rivr." style={{ width: "125px" }} />
      </div>
        <Card sx={styles.confirmCard}>
        <Typography variant="h4" sx={styles.title}>
            Email Verification
          </Typography>
          <Typography variant="h5" sx={styles.title}>
            Enter 6-Digit Code sent on Email
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
          <div style={styles.keypad}>
            {[...Array(9).keys()].map((num) => (
              <Button
                key={num + 1}
                sx={styles.keyButton}
                variant="contained"
                onClick={() => handleVirtualKeyPress(String(num + 1))}
              >
                {num + 1}
              </Button>
            ))}
            <Button variant="contained" sx={styles.keyButton} onClick={() => handleVirtualKeyPress("0")}>
              0
            </Button>
            <Button variant="contained" sx={styles.deleteButton} onClick={handleDeletePress}>
              Delete
            </Button>
          </div>
          <Button variant="contained" onClick={ handleEmailVerification} sx={styles.verifyButton}>
            Verify
          </Button>
        </Card>
      </div>
    );
  }
  if (isConfirming) {
    return (
      <div style={styles.wrapper}>
        <div style={{ position: "absolute", top: "20px", left: "20px" }}>
        <img src="/logo.png" alt="Rivr." style={{ width: "125px" }} />
      </div>
        <Card sx={styles.confirmCard}>
        <Typography variant="h4" sx={styles.title}>
            2 Factor Authentication
          </Typography>
          <Typography variant="h5" sx={styles.title}>
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
          <div style={styles.keypad}>
            {[...Array(9).keys()].map((num) => (
              <Button
                key={num + 1}
                sx={styles.keyButton}
                variant="contained"
                onClick={() => handleVirtualKeyPress(String(num + 1))}
              >
                {num + 1}
              </Button>
            ))}
            <Button variant="contained" sx={styles.keyButton} onClick={() => handleVirtualKeyPress("0")}>
              0
            </Button>
            <Button variant="contained" sx={styles.deleteButton} onClick={handleDeletePress}>
              Delete
            </Button>
          </div>
          <Button variant="contained" onClick={ isRegistering? handleRegisterConfirmSignUp: handleLoginConfirmSignUp} sx={styles.verifyButton}>
            Verify
          </Button>
        </Card>
      </div>
    );
  }

  if (isRegistering && !isConfirming) {
    return (
      <div style={styles.wrapper}>
        <div style={{ position: "absolute", top: "20px", left: "20px" }}>
        <img src="/logo.png" alt="Rivr." style={{ width: "125px" }} />
      </div>
        <Card sx={styles.registerCard}>
          <Typography variant="h5" sx={styles.title}>
            Scan QR Code to Sign Up with Google
          </Typography>
          <img
            src={qrCodeURL || "./G_Auth_QR_Code.png"}
            alt="Google Auth QR"
            style={{ width: "300px", height: "300px", marginBottom: "20px" }}
          />
          <Typography variant="body2" sx={{ paddingBottom: "10px" }}>
            Use an Authenticator App to scan the QR code and then click NEXT.
          </Typography>
          <Typography variant="body2" sx={{ paddingBottom: "10px" }}>
            OR  Paste this secret key in your Authenticator App and then click NEXT.
          </Typography>
          {totpSecretKey && (
            <>
              <Typography variant="body2" sx={{ paddingTop: "10px", fontWeight: "bold" }}>
                TOTP URI:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordWrap: "break-word",
                  wordBreak: "break-all",
                  maxWidth: "90%",
                  paddingBottom: "10px",
                  fontSize: "0.75rem",
                  color: "#333"
                }}
              >
                {totpSecretKey}
              </Typography>
            </>
          )}
          <Button variant="contained" onClick={handleIsConfirming} sx={styles.actionButton}>
            Next
          </Button>
        </Card>
      </div>
    );
  }
  

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
                Log In
              </Typography>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "10px" }}
                onChange={(e) => setEmail(e.target.value)}
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
              <Button variant="contained" sx={styles.actionButton} onClick={handleLogin}>
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

        <Card sx={isSwapped ? styles.activeCard : styles.swappedCard}>
          {!isSwapped ? (
            <>
              <Typography variant="h6" sx={{ marginBottom: "15px", textAlign: "center" }}>
                Don't have an account?
              </Typography>
              <Button variant="outlined" onClick={handleSwap} sx={styles.swapButton}>
                Register
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h4" sx={styles.title}>
                Register
              </Typography>

              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "10px" }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                label="First Name"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "10px" }}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <TextField
                label="Last Name"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "10px" }}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <TextField
                label="Date of Birth"
                type="date"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "10px" }}
                InputLabelProps={{ shrink: true }}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />

              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "10px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                sx={{ marginBottom: "20px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button variant="contained" onClick={handleDataVerification} sx={styles.actionButton}>
                Register
              </Button>
            </>
          )}
        </Card>
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

export default Auth;
