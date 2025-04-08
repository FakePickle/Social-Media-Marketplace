import React, { useState } from "react";
import { TextField, InputAdornment, Typography, List, ListItem, ListItemText, Button, Modal, Box, Avatar } from "@mui/material";
import { FaSearch } from "react-icons/fa";

function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [requests, setRequests] = useState([
    { id: 1, name: "Michael Scott", message: "Sent you a friend request" },
    { id: 2, name: "Pam Beesly", message: "Sent you a friend request" },
    { id: 3, name: "Jim Halpert", message: "Sent you a friend request" }
  ]);

  const peopleList = [
    ["https://randomuser.me/api/portraits/men/1.jpg", "John Doe", "I am a Software Engineer", false],
    ["https://randomuser.me/api/portraits/women/2.jpg", "Jane Smith", "Graphic Designer by passion", true],
    ["https://randomuser.me/api/portraits/women/3.jpg", "Alice Johnson", "Product Manager at TechCorp", false],
    ["https://randomuser.me/api/portraits/men/4.jpg", "Bob Brown", "Data Scientist & AI enthusiast", true],
    ["https://randomuser.me/api/portraits/men/5.jpg", "Charlie Davis", "Marketing Specialist", false],
    ["https://randomuser.me/api/portraits/women/6.jpg", "Emily White", "UX Designer, dreamer", false],
    ["https://randomuser.me/api/portraits/men/7.jpg", "Frank Green", "DevOps Engineer & coffee lover", true],
    ["https://randomuser.me/api/portraits/women/8.jpg", "Grace Lee", "Content Creator at BuzzFeed", false],
    ["https://randomuser.me/api/portraits/women/9.jpg", "Hannah Adams", "HR Specialist", true],
    ["https://randomuser.me/api/portraits/men/10.jpg", "Ian Black", "Mobile Developer", false],
    ["https://randomuser.me/api/portraits/women/11.jpg", "Jackie Brown", "Business Analyst & gamer", true],
    ["https://randomuser.me/api/portraits/women/12.jpg", "Karen Clark", "Project Coordinator", false],
    ["https://randomuser.me/api/portraits/men/13.jpg", "Liam Davis", "Full Stack Developer", true],
    ["https://randomuser.me/api/portraits/women/14.jpg", "Mia Evans", "Digital Marketer", false],
    ["https://randomuser.me/api/portraits/men/15.jpg", "Nathan Ford", "Cybersecurity Expert", false],
    ["https://randomuser.me/api/portraits/women/16.jpg", "Olivia Green", "SEO Specialist & blogger", true],
  ];
  
  const people = peopleList.map(([profilePic, name, bio, isFriend], index) => ({
    id: index + 1,
    profilePic,
    name,
    bio,
    isFriend,
  }));
  


  const handleAccept = (id) => {
    setRequests(requests.filter((request) => request.id !== id));
    alert("Request accepted!");
  };

  const handleDecline = (id) => {
    setRequests(requests.filter((request) => request.id !== id));
    alert("Request declined!");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Search Panel */}
      <div style={{ flex: 3, backgroundColor: "#1B263B", padding: "20px" }}>
        <Typography variant="h4" color="#778DA9" style={{ marginBottom: "20px" }}>
          Search
        </Typography>

        {/* Search Bar */}
        <TextField
          variant="outlined"
          placeholder="Search Chats"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} 
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch color="#778DA9" size={"20px"} />
              </InputAdornment>
            ),
            sx: { borderRadius: "30px", color: "white" }
          }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: "30px" },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: "#778DA9" },
          }}
        />

        {/* Search Results Grid */}
        {searchQuery && (
        <div
          style={{
            marginTop: "20px",
            maxHeight: "75vh", 
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            {people
              .filter((person) => person.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((person) => (
                <div
                  key={person.id}
                  onClick={() => setSelectedUser(person)}
                  style={{
                    backgroundColor: "#415A77",
                    borderRadius: "10px",
                    padding: "15px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                  }}
                >

                <div
                  key={person.id}
                  style={{
                    backgroundColor: "#415A77",
                    borderRadius: "10px",
                    padding: "15px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center"
                  }}
                >
                  <img
                    src={person.profilePic}
                    alt={person.name}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      marginBottom: "10px"
                    }}
                  />
                  <Typography variant="h6" color="#E0E1DD">
                    {person.name}
                  </Typography>
                  <Typography variant="body2" color="#778DA9">
                    {person.bio}
                  </Typography>
                </div>
                </div>
              ))}
          </div>
        </div>
      )}

      </div>

      {/* Right Chat Window */}
      <div style={{ flex: 1, backgroundColor: "#415A77", display: "flex", flexDirection: "column", padding: "10px" }}>
        {/* Requests Section */}
        <Typography variant="h4" color="white" style={{ marginBottom: "20px" }}>
          Requests
        </Typography>
        <List>
          {requests.map((request) => (
            <ListItem
              key={request.id}
              style={{
                backgroundColor: "#1B263B",
                marginBottom: "10px",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
              }}
            >
              <ListItemText
                primary={<Typography style={{ color: "#E0E1DD" }}>{request.name}</Typography>}
                secondary={<Typography style={{ color: "#778DA9" }}>{request.message}</Typography>}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleAccept(request.id)}
                >
                  Accept
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDecline(request.id)}
                >
                  Decline
                </Button>
              </div>
            </ListItem>
          ))}
        </List>
      </div>
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#1B263B",
            borderRadius: "15px",
            boxShadow: 24,
            p: 4,
            minWidth: 300,
            textAlign: "center",
          }}
        >
          {selectedUser && (
            <>
              <Avatar
                src={selectedUser.profilePic}
                alt={selectedUser.name}
                sx={{ width: 100, height: 100, margin: "0 auto", mb: 2 }}
              />
              <Typography variant="h6" color="#E0E1DD" gutterBottom>
                {selectedUser.name}
              </Typography>
              <Typography variant="body2" color="#778DA9" gutterBottom>
                {selectedUser.bio}
              </Typography>
              {selectedUser.isFriend ? (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    alert("Friend removed!");
                    setSelectedUser(null);
                  }}
                >
                  Remove Friend
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    alert("Friend request sent!");
                    setSelectedUser(null);
                  }}
                >
                  Add Friend
                </Button>
              )}
            </>
          )}
        </Box>
      </Modal>

    </div>
    
  );
}

export default Search;