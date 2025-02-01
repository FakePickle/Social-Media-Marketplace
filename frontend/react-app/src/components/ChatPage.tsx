import React from "react";
import { useNavigate } from "react-router-dom";
import "./ChatPage.css";

function ChatPage() {
    const navigate = useNavigate();

    const handleChatClick = (chatName: string) => {
        console.log(`Navigating to chat: ${chatName}`);
        // Navigate to the chat page or handle chat click logic here
    };

    const handleSearchClick = () => {
        navigate('/findpeople');
    };

    return (
        <div className="chat-app">
            <div className="left-sidebar">
                <h1 className="app-title">Rivr.</h1>
                <div className="sidebar-icons-top">
                    <div className="sidebar-icon">&#x1F4AC;</div>
                    <div className="sidebar-icon" onClick={handleSearchClick}>&#x1F50D;</div>  
                    <div className="sidebar-icon">&#x1F4B8;</div>
                </div>
                <div className="sidebar-footer">
                    
                    <div className="sidebar-icon">
                        &#x2699; <span className="icon-label">Settings</span>
                    </div>
                    <div className="sidebar-icon">
                        &#x1F464; <span className="icon-label">Profile</span>
                    </div>
                </div>
            </div>
            <div className="sidebar">
                <h1 className="app-title">Chats</h1>
                <div className="chats">
                    <input className="search-bar" type="text" placeholder="Search chats" />
                    <div className="chat-item" onClick={() => handleChatClick('Person 1')}>Person 1</div>
                    <div className="chat-item" onClick={() => handleChatClick('Person 2')}>Person 2</div>
                    <div className="chat-item" onClick={() => handleChatClick('Group 1')}>Group 1</div>
                    <div className="chat-item" onClick={() => handleChatClick('Person 3')}>Person 3</div>
                </div>
            </div>
            <div className="chat-window">
                <div className="chat-header">
                    <div className="chat-title">Person 1</div>
                </div>
                <div className="chat-content"></div>
                <div className="chat-footer">
                    <input className="message-input" type="text" placeholder="Type a message" />
                </div>
            </div>
        </div>
    );
}

export default ChatPage;


