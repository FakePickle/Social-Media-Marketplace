import {React, useState} from 'react'
import { FaBars, FaComments, FaSearch, FaStore, FaCog } from "react-icons/fa";
import {Button  } from "@mui/material";
import Account from './Account';
import { MdOutlineAccountCircle } from "react-icons/md";
function Sidebar({ currentTab, setCurrentTab, expanded, setExpanded }) {
  const [anchorEl, setAnchorEl] = useState(null);

    const handleAccountClick = (event) => {
      setCurrentTab("Account");
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };
    return (
        <div style={{
          width: expanded ? "80px" : "165px",
          height: "100vh",
          backgroundColor: "#0d1b2a",
          display: "flex",
          flexDirection: "column",
          alignItems: expanded ? "center" : "start",
          paddingTop: "80px",
          paddingLeft: "10px",
          position: "fixed",
          left: 0,
          top: 0,
          transition: "width 0.3s ease-in-out"
        }}>
          <Button title="Menu" variant="filled" startIcon={<FaBars size={24} color="white" />} onClick={() => setExpanded(!expanded)} style={{ marginBottom: "20px", transition: "all 0.3s ease-in-out" }}>
          </Button>
          <Button 
            title="Messages" 
            onClick={() => setCurrentTab("Messages")}
            variant="filled" startIcon={<FaComments size={24} color={currentTab === "Messages" ? "white" : "#778DA9"} />}
            style={{ margin: "20px 0", color: currentTab === "Messages" && !expanded ? "white" : "#778da9", transition: "color 0.3s ease-in-out" }}>
            {!expanded && "Messages"}
          </Button>
          <Button 
            title="Search" 
            onClick={() => setCurrentTab("Search")}
            style={{ margin: "20px 0", color: currentTab === "Search" && !expanded ? "white" : "#778da9", transition: "color 0.3s ease-in-out" }}
            variant="filled"
            startIcon={<FaSearch size={24} color={currentTab === "Search" ? "white" : "#778DA9"} />}>
            {!expanded && "Search"}
          </Button>
          <Button 
            title="Marketplace" 
            onClick={() => setCurrentTab("Marketplace")}
            style={{ margin: "20px 0", color: currentTab === "Marketplace" && !expanded ? "white" : "#778da9", transition: "color 0.3s ease-in-out" }}
            variant="filled"
            startIcon={<FaStore size={24} color={currentTab === "Marketplace" ? "white" : "#778DA9"} />}>
            {!expanded && "MarketPlace"}
          </Button>
          <div style={{ flexGrow: 1 }}></div>
          <Button 
            title="Account" 
            onClick={handleAccountClick}
            style={{ margin: "20px 0", color: currentTab === "Account" && !expanded ? "white" : "#778da9", transition: "color 0.3s ease-in-out" }}
            variant="filled"
            startIcon={<MdOutlineAccountCircle size={30} color={currentTab === "Account" ? "white" : "#778DA9"} />}>
            {!expanded && "Account"}
          </Button>
          <Account anchorEl={anchorEl} handleClose={handleClose} />
          <Button 
            title="Settings" 
            onClick={() => setCurrentTab("Settings")}
            style={{ marginBottom: "100px", color: currentTab === "Settings" && !expanded ? "white" : "#778da9", transition: "color 0.3s ease-in-out" }}
            variant="filled"
            startIcon={<FaCog size={24} color={currentTab === "Settings" ? "white" : "#778DA9"} />}>
            {!expanded && "Settings"}
          </Button>
        </div>
      )
}

export default Sidebar