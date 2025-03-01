import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegisterClick = () => {
        navigate("/signup");
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        console.log(`Username: ${username}, Password: ${password}`);
        // Handle login logic here
        navigate("/chatpage");
    };

    return (
        <div className="container">
            <header className="header">Rivr.</header>
            <div className="login-box">
                <h1>Log In</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
                <div className="bottom-text">
                    Don't have an account?
                </div>
                <button type="button" className="register-button" onClick={handleRegisterClick}>Register</button>
            </div>
        </div>
    );
}

export default Login;
