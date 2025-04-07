import {React, useState} from 'react'
import TopNav from '../Components/TopNav'
import AdminSideBar from '../Components/AdminSideBar'
import UserManagement from '../Components/UserManagement';
import DocumentVerifications from '../Components/DocumentVerifications';
import SecurityAudits from '../Components/SecurityAudits';
import Settings from '../Components/Settings';
import Account from '../Components/Account';

function AdminDashboard({userList}) {
  const [currentTab, setCurrentTab] = useState("User Management");
  const [expanded, setExpanded] = useState(true);
  
  
  return (
    <div style={{backgroundColor:"#1B263B", overflow: "hidden"}}>
    <AdminSideBar  currentTab={currentTab} setCurrentTab={setCurrentTab} expanded={expanded} setExpanded={setExpanded}/>
    <TopNav />
    <div style={{ marginLeft: expanded ? "90px" : "175px", marginTop: "47px", padding: "20px", backgroundColor: "#1B263B", height: "91.25vh", transition: "margin-left 0.3s ease-in-out" }}>
        {currentTab === "User Management" && <UserManagement userList={userList} />}
        {currentTab === "Document Verifications" && <DocumentVerifications userList={userList}/>}
        {currentTab === "Security Audits" && <SecurityAudits />}
        {currentTab === "Settings" && <Settings />}
        {currentTab === "Account" && <Account />}
      </div>
    </div>
  )
}

export default AdminDashboard