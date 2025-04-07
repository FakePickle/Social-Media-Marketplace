import {React, useState} from 'react'
import { FaBars, FaCog } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";
import { IoDocumentsOutline } from "react-icons/io5";
import {Button  } from "@mui/material";
import { AiOutlineAudit } from "react-icons/ai";
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
            title="User Management" 
            onClick={() => setCurrentTab("User Management")}
            variant="filled" startIcon={<HiUsers size={24} color={currentTab === "User Management" ? "white" : "#778DA9"} />}
            style={{ margin: "20px 0", color: currentTab === "User Management" && !expanded ? "white" : "#778da9", transition: "color 0.3s ease-in-out" }}>
            {!expanded && "User Management"}
          </Button>
          <Button 
            title="Document Verifications" 
            onClick={() => setCurrentTab("Document Verifications")}
            style={{ margin: "20px 0", color: currentTab === "Document Verificaations" && !expanded ? "white" : "#778da9", transition: "color 0.3s ease-in-out" }}
            variant="filled"
            startIcon={<IoDocumentsOutline size={24} color={currentTab === "Document Verifications" ? "white" : "#778DA9"} />}>
            {!expanded && "Document Verifications"}
          </Button>
          <Button 
            title="Security Audits" 
            onClick={() => setCurrentTab("Security Audits")}
            style={{ margin: "20px 0", color: currentTab === "Security Audits" && !expanded ? "white" : "#778da9", transition: "color 0.3s ease-in-out" }}
            variant="filled"
            startIcon={<AiOutlineAudit size={24} color={currentTab === "Security Audits" ? "white" : "#778DA9"} />}>
            {!expanded && "Security Audits"}
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