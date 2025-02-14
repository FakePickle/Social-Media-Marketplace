import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FindPeople.css";

function FindPeople() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleProfileClick = () => {
        navigate('/');
    };

    return (
        <div className="chat-app">
            <div className="left-sidebar">
                <h1 className="app-title">Rivr.</h1>
                <div className="sidebar-icons-top">
                    <div className="sidebar-icon" onClick={() => navigate('/chatpage')}>&#x1F4AC;</div>
                    <div className="sidebar-icon" onClick={() => navigate('/findpeople')}>&#x1F50D;</div>
                    <div className="sidebar-icon">&#x1F4B8;</div>
                </div>
                <div className="sidebar-footer">
                    
                    <div className="sidebar-icon">&#x2699; <span className="icon-label">Settings</span>
                    </div>
                    <div className="sidebar-icon" onClick={handleProfileClick}>&#x1F464; <span className="icon-label">Profile</span>
                    </div>
                </div>
            </div>
            <div className="main-content">
                <input
                    className="search-bar"
                    type="text"
                    placeholder="Search for people..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
        </div>
    );
}

export default FindPeople;


