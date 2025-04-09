import { Card, TextField, Button, Typography } from "@mui/material";
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import ForgotPassw from "../components/ForgotPassw";

function Auth() {
    const { login, register, verifyEmail, verify2FA } = useContext(AuthContext);
    const [isSwapped, setIsSwapped] = useState(false); // Login/Register card swap
    const [authMode, setAuthMode] = useState("default"); // "default", "verifyEmail", "verify2FA"
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [dob, setDob] = useState("");
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
    const [qrCodeURL, setQrCodeURL] = useState("");
    const [totpSecretKey, setTotpSecretKey] = useState("");
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false); // Track registration flow

    const navigate = useNavigate();

    const handleSwap = () => {
        setIsSwapped(!isSwapped);
        setError("");
    };

    // Cleanup sensitive state on unmount
    useEffect(() => {
        return () => {
            setEmail("");
            setPassword("");
            setFirstName("");
            setUsername("");
            setLastName("");
            setDob("");
            setVerificationCode(["", "", "", "", "", ""]);
            setQrCodeURL("");
            setTotpSecretKey("");
            setError("");
        };
    }, []);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Email and password are required.");
            return;
        }
        try {
            const data = await login(email, password);
            setAuthMode("verify2FA");
            setError("");
        } catch (error) {
            setError(error.error || "Login failed");
        }
    };

    const handleRegister = async () => {
        if (!username.trim() || !password.trim() || !email.trim() || !firstName.trim() || !lastName.trim() || !dob) {
            setError("All fields are required.");
            return;
        }
        try {
            const data = await register(email, username, password, firstName, lastName, dob);
            setAuthMode("verifyEmail");
            setIsRegistering(true);
            setError("");
        } catch (error) {
            setError(error.error || "Registration failed");
        }
    };

    const handleEmailVerification = async () => {
        try {
            const otp = verificationCode.join("");
            const data = await verifyEmail(otp, email);
            if (data.qr_code && data.totp_uri) {
                setQrCodeURL(data.qr_code);
                setTotpSecretKey(data.totp_uri);
                setVerificationCode(["", "", "", "", "", ""]);
                setAuthMode("verify2FA");
                setError("");
            } else {
                throw new Error("Invalid verification response");
            }
        } catch (error) {
            setError(error.error || error.message || "Email verification failed");
        }
    };

    const handleLoginConfirmSignUp = async () => {
        try {
            const totp = verificationCode.join("");
            await verify2FA(totp, email);
            setEmail("");
            setPassword("");
            setVerificationCode(["", "", "", "", "", ""]);
            setAuthMode("default");
            setError("");
            navigate("/home");
        } catch (error) {
            setError(error.error || error.message || "2FA verification failed");
        }
    };

    const handleRegisterConfirmSignUp = async () => {
        try {
            const totp = verificationCode.join("");
            await verify2FA(totp, email);
            setEmail("");
            setPassword("");
            setFirstName("");
            setUsername("");
            setLastName("");
            setDob("");
            setVerificationCode(["", "", "", "", "", ""]);
            setQrCodeURL("");
            setTotpSecretKey("");
            setIsSwapped(false);
            setIsRegistering(false);
            setAuthMode("default");
            setError("");
            navigate("/home");
        } catch (error) {
            setError(error.error || error.message || "2FA verification failed");
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

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            if (!isSwapped) handleLogin();
                else handleRegister();
        }
    };

    if (isForgotPassword) {
        return <ForgotPassw />;
    }

    if (authMode === "verifyEmail") {
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
                    <Button variant="contained" onClick={handleEmailVerification} sx={styles.verifyButton}>
                        Verify
                    </Button>
                    {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                </Card>
            </div>
        );
    }

    if (authMode === "verify2FA") {
        return (
            <div style={styles.wrapper}>
                <div style={{ position: "absolute", top: "20px", left: "20px" }}>
                    <img src="/logo.png" alt="Rivr." style={{ width: "125px" }} />
                </div>
                <Card sx={styles.confirmCard}>
                    <Typography variant="h4" sx={styles.title}>
                        2 Factor Authentication
                    </Typography>
                    {isRegistering && qrCodeURL && (
                        <>
                            <Typography variant="h5" sx={styles.title}>
                                Scan QR Code to Set Up 2FA
                            </Typography>
                            <img
                                src={qrCodeURL}
                                alt="Google Auth QR"
                                style={{ width: "300px", height: "300px", marginBottom: "20px" }}
                            />
                            <Typography variant="body2" sx={{ paddingBottom: "10px" }}>
                                Use an Authenticator App to scan the QR code.
                            </Typography>
                            {totpSecretKey && (
                                <>
                                    <Typography variant="body2" sx={{ paddingTop: "10px", fontWeight: "bold" }}>
                                        Or paste this secret key:
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            wordWrap: "break-word",
                                            wordBreak: "break-all",
                                            maxWidth: "90%",
                                            paddingBottom: "10px",
                                            fontSize: "0.75rem",
                                            color: "#333",
                                        }}
                                    >
                                        {totpSecretKey}
                                    </Typography>
                                </>
                            )}
                        </>
                    )}
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
                    <Button
                        variant="contained"
                        onClick={isRegistering ? handleRegisterConfirmSignUp : handleLoginConfirmSignUp}
                        sx={styles.verifyButton}
                    >
                        Verify
                    </Button>
                    {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <TextField
                                label="Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                sx={{ marginBottom: "20px" }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Button variant="contained" sx={styles.actionButton} onClick={handleLogin}>
                                Log In
                            </Button>
                            <Button variant="text" onClick={() => setIsForgotPassword(true)} sx={{ marginTop: "10px" }}>
                                Forgot Password?
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
                                <Button variant="contained" onClick={handleRegister} sx={styles.actionButton}>
                                    Register
                                </Button>
                            </>
                        )}
                </Card>
            </div>
            {error && (
                <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
                    {error}
                </Typography>
            )}
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
    verificationContainer: {
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
    },
    verificationInput: {
        width: "40px",
    },
    virtualKeyboard: {
        display: "flex",
        gap: "10px",
    },
    virtualKey: {
        width: "40px",
        height: "40px",
        backgroundColor: "#415a77",
        color: "white",
        "&:hover": { backgroundColor: "#1b263b" },
    },
};

export default Auth;
