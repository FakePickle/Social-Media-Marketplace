import React, { useState } from "react";
import TopNav from "../Components/TopNav";
import Sidebar from "../Components/Sidebar";
import Chats from "../Components/Chats";
import Search from "../Components/Search";
import Marketplace from "../Components/Marketplace";
import Settings from "../Components/Settings";
import Account from "../Components/Account";
const Home = () => {
  const [currentTab, setCurrentTab] = useState("Messages");
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={{backgroundColor:"#1B263B", overflow: "hidden"}}>
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} expanded={expanded} setExpanded={setExpanded} />
      <TopNav />
      <div style={{ marginLeft: expanded ? "90px" : "175px", marginTop: "47px", padding: "20px", backgroundColor: "#1B263B", height: "90vh", transition: "margin-left 0.3s ease-in-out" }}>
        {currentTab === "Messages" && <Chats />}
        {currentTab === "Search" && <Search />}
        {currentTab === "Marketplace" && <Marketplace />}
        {currentTab === "Settings" && <Settings />}
        {currentTab === "Account" && <Account />}
      </div>
    </div>
  );
};

export default Home;
