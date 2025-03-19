import React from 'react'

function TopNav() {
    return (
        <div style={{
          width: "100%",
          height: "50px",
          backgroundColor: "#0d1b2a",
          display: "flex",
          alignItems: "center",
          paddingLeft: "20px",
          paddingBottom: "20px",
          paddingTop: "10px",
          position: "fixed",
          top: 0,
          left: 0,
          transition: "all 0.3s ease-in-out"
        }}>
          <img src="/logo.png" alt="Logo" style={{ width: "100px" }} />
        </div>
      );
}

export default TopNav