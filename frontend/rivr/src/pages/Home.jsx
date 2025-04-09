import React, { useState } from "react";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import Chats from "../components/Chats";
import Search from "../components/Search";
import Marketplace from "../components/Marketplace";
import Settings from "../components/Settings";
import Account from "../components/Account";
import Chat from "../components/Chat"
const Home = () => {
  const [currentTab, setCurrentTab] = useState("Messages");
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={{backgroundColor:"#1B263B", overflow: "hidden"}}>
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} expanded={expanded} setExpanded={setExpanded} />
      <TopNav />
      <div style={{ marginLeft: expanded ? "90px" : "175px", marginTop: "47px", padding: "20px", backgroundColor: "#1B263B", height:"92vh", transition: "margin-left 0.3s ease-in-out" }}>
        {currentTab === "Messages" && <Chat />}
        {currentTab === "Search" && <Search />}
        {currentTab === "Marketplace" && <Marketplace />}
        {currentTab === "Settings" && <Settings />}
        {currentTab === "Account" && <Account />}
      </div>
    </div>
  );
};

export default Home;
