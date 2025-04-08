import React, { useState } from "react";
import { TextField, InputAdornment, Typography, List, ListItem, ListItemText, Button } from "@mui/material";
import { FaSearch } from "react-icons/fa";

function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState([
    { id: 1, name: "Michael Scott", message: "Sent you a friend request" },
    { id: 2, name: "Pam Beesly", message: "Sent you a friend request" },
    { id: 3, name: "Jim Halpert", message: "Sent you a friend request" }
  ]);

  const people = [
    { id: 1, name: "John Doe", profilePic: "path/to/john.jpg", bio: "I am a Software Engineer" },
    { id: 2, name: "Jane Smith", profilePic: "path/to/jane.jpg", bio: "I am a Graphic Designer" },
    { id: 3, name: "Alice Johnson", profilePic: "path/to/alice.jpg", bio: "Product Manager" },
    { id: 4, name: "Bob Brown", profilePic: "path/to/bob.jpg", bio: "Data Scientist" },
    { id: 5, name: "Charlie Davis", profilePic: "path/to/charlie.jpg", bio: "Marketing Specialist" },
    { id: 6, name: "Emily White", profilePic: "path/to/emily.jpg", bio: "UX Designer" },
    { id: 7, name: "Frank Green", profilePic: "path/to/frank.jpg", bio: "DevOps Engineer" },
    { id: 8, name: "Grace Lee", profilePic: "path/to/grace.jpg", bio: "Content Creator" },
    { id: 9, name: "Hannah Adams", profilePic: "path/to/hannah.jpg", bio: "HR Specialist" },
    { id: 10, name: "Ian Black", profilePic: "path/to/ian.jpg", bio: "Mobile Developer" },
    { id: 11, name: "Jackie Brown", profilePic: "path/to/jackie.jpg", bio: "Business Analyst" },
    { id: 12, name: "Karen Clark", profilePic: "path/to/karen.jpg", bio: "Project Coordinator" },
    { id: 13, name: "Liam Davis", profilePic: "path/to/liam.jpg", bio: "Full Stack Developer" },
    { id: 14, name: "Mia Evans", profilePic: "path/to/mia.jpg", bio: "Digital Marketer" },
    { id: 15, name: "Nathan Ford", profilePic: "path/to/nathan.jpg", bio: "Cybersecurity Expert" },
    { id: 16, name: "Olivia Green", profilePic: "path/to/olivia.jpg", bio: "SEO Specialist" }
  ];


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

        {/* Search Bar without Dropdown */}
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
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "20px"
            }}
          >
            {people
              .filter((person) => person.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((person) => (
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
              ))}
          </div>
        )}
      </div>

      {/* Right Chat Window */}
      <div style={{ flex: 1, backgroundColor: "#415A77", display: "flex", flexDirection: "column", padding: "10px" }}>
        {/* Requests Section */}
        <Typography variant="h4" color="#778DA9" style={{ marginBottom: "20px" }}>
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
    </div>
  );
}

export default Search;